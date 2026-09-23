package com.cardapio.service;

import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.usuario.FiltroUsuario;
import com.cardapio.dto.usuario.UsuarioConviteResponse;
import com.cardapio.dto.usuario.UsuarioLojaRequest;
import com.cardapio.dto.usuario.UsuarioLojaResponse;
import com.cardapio.entity.S_Loja;
import com.cardapio.entity.S_Perfil;
import com.cardapio.entity.S_Usuario;
import com.cardapio.entity.StatusPerfilUsuario;
import com.cardapio.entity.T_PerfilUsuario;
import com.cardapio.entity.T_Pessoa;
import com.cardapio.entity.T_PessoaFisica;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.S_LojaRepository;
import com.cardapio.repository.S_PerfilRepository;
import com.cardapio.repository.S_UsuarioRepository;
import com.cardapio.repository.T_PerfilUsuarioRepository;
import com.cardapio.repository.T_PessoaFisicaRepository;
import com.cardapio.repository.T_PessoaRepository;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * CRUD dos usuarios de uma loja. Um usuario (s_usuario) pode estar em varias lojas;
 * aqui se trabalha sempre com o vinculo da loja (t_perfil_usuario) e a pessoa dela.
 *
 * Usuario novo nasce PENDENTE, com senha inutilizavel, token de "esqueci a senha" e
 * exige_trocar_senha = true; vira ATIVO quando define a senha pelo link /novo-usuario/{token}.
 */
@Service
@RequiredArgsConstructor
public class UsuarioLojaService {

    static final long VALIDADE_CONVITE_HORAS = 72;
    private static final String PAPEL_PADRAO = "ROLE_ADMIN_LOJA";
    private static final int TAMANHO_MAXIMO_PAGINA = 50;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final S_UsuarioRepository usuarioRepository;
    private final S_LojaRepository lojaRepository;
    private final S_PerfilRepository perfilRepository;
    private final T_PerfilUsuarioRepository perfilUsuarioRepository;
    private final T_PessoaRepository pessoaRepository;
    private final T_PessoaFisicaRepository pessoaFisicaRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public PaginaResponse<UsuarioLojaResponse> buscar(UUID tenant, FiltroUsuario filtro, int pagina, int tamanho) {
        int tamanhoLimitado = Math.min(Math.max(tamanho, 1), TAMANHO_MAXIMO_PAGINA);
        var resultado = perfilUsuarioRepository.findAll(
                especificacao(tenant, filtro), PageRequest.of(Math.max(pagina, 0), tamanhoLimitado));
        return PaginaResponse.of(resultado, UsuarioLojaResponse::of);
    }

    @Transactional(readOnly = true)
    public UsuarioLojaResponse obter(UUID tenant, UUID usuarioGuid) {
        return UsuarioLojaResponse.of(buscarVinculo(tenant, usuarioGuid));
    }

    @Transactional
    public UsuarioConviteResponse criar(UUID tenant, UsuarioLojaRequest request) {
        S_Loja loja = lojaRepository.findByGuid(tenant)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Loja nao encontrada"));
        S_Perfil papel = perfilRepository.findByCodigo(PAPEL_PADRAO)
                .orElseThrow(() -> new IllegalStateException("Perfil " + PAPEL_PADRAO + " nao cadastrado"));

        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String nome = request.nome().trim();

        S_Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);
        T_PerfilUsuario vinculo = usuario == null
                ? null
                : perfilUsuarioRepository.findByUsuarioIdAndTenant(usuario.getId(), tenant).orElse(null);
        if (vinculo != null && !vinculo.isDeletado()) {
            throw new RegraNegocioException("Este e-mail ja esta cadastrado nesta loja");
        }

        boolean novo = usuario == null;
        if (novo) {
            usuario = usuarioRepository.save(S_Usuario.builder()
                    .nome(nome)
                    .email(email)
                    .senha(passwordEncoder.encode(UUID.randomUUID() + gerarToken())) // inutilizavel ate o convite
                    .build());
        }

        // Quem ainda nao definiu a senha (usuario novo ou convidado antes) fica pendente e recebe um link.
        boolean pendente = novo || usuario.isExigeTrocarSenha();
        if (pendente) {
            prepararConvite(usuario);
            usuarioRepository.save(usuario);
        }

        T_PessoaFisica pessoaFisica = pessoaFisicaRepository.save(T_PessoaFisica.builder()
                .tenant(tenant).nome(nome).build());
        T_Pessoa pessoa = pessoaRepository.save(T_Pessoa.builder()
                .tenant(tenant).pessoaFisica(pessoaFisica).build());
        StatusPerfilUsuario status = pendente ? StatusPerfilUsuario.PENDENTE : StatusPerfilUsuario.ATIVO;

        if (vinculo != null) { // vinculo excluido antes: reativa
            vinculo.setDeletado(false);
            vinculo.setAtivo(true);
            vinculo.setPessoa(pessoa);
            vinculo.setPerfil(papel);
            vinculo.setStatus(status);
        } else {
            vinculo = T_PerfilUsuario.builder()
                    .tenant(tenant).usuario(usuario).pessoa(pessoa).loja(loja).perfil(papel).status(status)
                    .build();
        }
        perfilUsuarioRepository.save(vinculo);

        return convite(vinculo, pendente);
    }

    @Transactional
    public UsuarioLojaResponse atualizar(UUID tenant, UUID usuarioGuid, UsuarioLojaRequest request) {
        T_PerfilUsuario vinculo = buscarVinculo(tenant, usuarioGuid);

        T_PessoaFisica pessoaFisica = vinculo.getPessoa().getPessoaFisica();
        if (pessoaFisica != null) {
            pessoaFisica.setNome(request.nome().trim());
            pessoaFisicaRepository.save(pessoaFisica);
        }
        if (request.ativo() != null) {
            vinculo.setAtivo(request.ativo());
        }
        if (request.status() != null) {
            if (request.status() == StatusPerfilUsuario.ATIVO && vinculo.getUsuario().isExigeTrocarSenha()) {
                throw new RegraNegocioException("O usuario ainda nao definiu a senha, entao nao pode ser ativado");
            }
            vinculo.setStatus(request.status());
        }
        return UsuarioLojaResponse.of(perfilUsuarioRepository.save(vinculo));
    }

    /** Exclusao logica do vinculo com a loja; a conta do usuario (e suas outras lojas) nao e afetada. */
    @Transactional
    public void excluir(UUID tenant, UUID usuarioGuid, Long usuarioLogadoId) {
        T_PerfilUsuario vinculo = buscarVinculo(tenant, usuarioGuid);
        if (vinculo.getUsuario().getId().equals(usuarioLogadoId)) {
            throw new RegraNegocioException("Voce nao pode excluir o proprio usuario");
        }
        vinculo.setDeletado(true);
        vinculo.setAtivo(false);
        perfilUsuarioRepository.save(vinculo);
    }

    /** Gera um novo link de definicao de senha para um usuario que ainda nao a definiu. */
    @Transactional
    public UsuarioConviteResponse gerarNovoLink(UUID tenant, UUID usuarioGuid) {
        T_PerfilUsuario vinculo = buscarVinculo(tenant, usuarioGuid);
        S_Usuario usuario = vinculo.getUsuario();
        if (!usuario.isExigeTrocarSenha()) {
            throw new RegraNegocioException("Este usuario ja definiu a senha");
        }
        prepararConvite(usuario);
        usuarioRepository.save(usuario);
        return convite(vinculo, true);
    }

    private UsuarioConviteResponse convite(T_PerfilUsuario vinculo, boolean comToken) {
        S_Usuario usuario = vinculo.getUsuario();
        return new UsuarioConviteResponse(
                UsuarioLojaResponse.of(vinculo),
                comToken ? usuario.getEsqueciSenhaToken() : null,
                comToken ? usuario.getEsqueciSenhaExpiraEm() : null);
    }

    private void prepararConvite(S_Usuario usuario) {
        usuario.setEsqueciSenhaToken(gerarToken());
        usuario.setEsqueciSenhaExpiraEm(LocalDateTime.now().withNano(0).plusHours(VALIDADE_CONVITE_HORAS));
        usuario.setExigeTrocarSenha(true);
    }

    private String gerarToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private T_PerfilUsuario buscarVinculo(UUID tenant, UUID usuarioGuid) {
        return perfilUsuarioRepository.findByUsuarioGuidAndTenantAndDeletadoFalse(usuarioGuid, tenant)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuario nao encontrado"));
    }

    private Specification<T_PerfilUsuario> especificacao(UUID tenant, FiltroUsuario filtro) {
        return (root, query, cb) -> {
            Join<T_PerfilUsuario, S_Usuario> usuario = root.join("usuario");
            Join<T_PerfilUsuario, T_Pessoa> pessoa = root.join("pessoa");
            Join<T_Pessoa, T_PessoaFisica> pessoaFisica = pessoa.join("pessoaFisica", JoinType.LEFT);
            Expression<String> nome = cb.coalesce(pessoaFisica.<String>get("nome"), usuario.<String>get("nome"));
            Expression<String> email = usuario.get("email");

            List<Predicate> filtros = new ArrayList<>();
            filtros.add(cb.equal(root.get("tenant"), tenant));
            filtros.add(cb.isFalse(root.get("deletado")));

            if (temTexto(filtro.busca())) {
                String padrao = padrao(filtro.busca());
                filtros.add(cb.or(cb.like(cb.lower(nome), padrao, '\\'), cb.like(cb.lower(email), padrao, '\\')));
            }
            if (temTexto(filtro.nome())) {
                filtros.add(cb.like(cb.lower(nome), padrao(filtro.nome()), '\\'));
            }
            if (temTexto(filtro.email())) {
                filtros.add(cb.like(cb.lower(email), padrao(filtro.email()), '\\'));
            }
            if (filtro.ativo() != null) {
                filtros.add(cb.equal(root.get("ativo"), filtro.ativo()));
            }
            if (filtro.status() != null) {
                filtros.add(cb.equal(root.get("status"), filtro.status()));
            }

            if (query.getResultType() != Long.class) { // a consulta de contagem nao precisa de ordem
                query.orderBy(cb.asc(cb.lower(nome)));
            }
            return cb.and(filtros.toArray(new Predicate[0]));
        };
    }

    private boolean temTexto(String valor) {
        return valor != null && !valor.isBlank();
    }

    /** Padrao "contem", ignorando maiusculas e escapando os curingas do LIKE. */
    private String padrao(String valor) {
        String escapado = valor.trim().toLowerCase(Locale.ROOT)
                .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return "%" + escapado + "%";
    }
}
