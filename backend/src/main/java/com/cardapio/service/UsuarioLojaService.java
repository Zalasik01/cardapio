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
import com.cardapio.entity.T_Funcionario;
import com.cardapio.entity.T_PerfilUsuario;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.S_LojaRepository;
import com.cardapio.repository.S_PerfilRepository;
import com.cardapio.repository.S_UsuarioFotoRepository;
import com.cardapio.repository.S_UsuarioRepository;
import com.cardapio.repository.T_FuncionarioRepository;
import com.cardapio.repository.T_PerfilUsuarioRepository;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
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
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * CRUD dos usuarios de uma loja. Um usuario (s_usuario) pode estar em varias lojas;
 * aqui se trabalha sempre com o vinculo da loja (t_perfil_usuario), que aponta para a
 * pessoa do funcionario escolhido.
 *
 * Usuario novo nasce PENDENTE, com senha inutilizavel, token de "esqueci a senha" e
 * exige_trocar_senha = true; vira ATIVO quando define a senha pelo link /novo-usuario/{token}.
 */
@Service
@RequiredArgsConstructor
public class UsuarioLojaService {

    static final long VALIDADE_CONVITE_HORAS = 72;
    // Todos os usuarios de loja usam este papel por enquanto; "administrador" e uma opcao
    // separada, base das permissoes (implementacao futura).
    private static final String PAPEL_PADRAO = "ROLE_ADMIN_LOJA";
    private static final int TAMANHO_MAXIMO_PAGINA = 50;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final S_UsuarioRepository usuarioRepository;
    private final S_LojaRepository lojaRepository;
    private final S_PerfilRepository perfilRepository;
    private final T_PerfilUsuarioRepository perfilUsuarioRepository;
    private final T_FuncionarioRepository funcionarioRepository;
    private final S_UsuarioFotoRepository fotoRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public PaginaResponse<UsuarioLojaResponse> buscar(UUID tenant, FiltroUsuario filtro, int pagina, int tamanho) {
        int tamanhoLimitado = Math.min(Math.max(tamanho, 1), TAMANHO_MAXIMO_PAGINA);
        var resultado = perfilUsuarioRepository.findAll(
                especificacao(tenant, filtro), PageRequest.of(Math.max(pagina, 0), tamanhoLimitado));

        List<T_PerfilUsuario> vinculos = resultado.getContent();
        Map<Long, T_Funcionario> funcionarios = funcionariosPorPessoa(vinculos);
        Set<Long> comFoto = usuariosComFoto(vinculos);
        return PaginaResponse.of(resultado, vinculo -> UsuarioLojaResponse.of(
                vinculo, funcionarios.get(vinculo.getPessoa().getId()), comFoto.contains(vinculo.getUsuario().getId())));
    }

    @Transactional(readOnly = true)
    public UsuarioLojaResponse obter(UUID tenant, UUID usuarioGuid) {
        return resposta(buscarVinculo(tenant, usuarioGuid));
    }

    @Transactional
    public UsuarioConviteResponse criar(UUID tenant, UsuarioLojaRequest request) {
        S_Loja loja = lojaRepository.findByGuid(tenant)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Loja nao encontrada"));
        S_Perfil papel = perfilRepository.findByCodigo(PAPEL_PADRAO)
                .orElseThrow(() -> new IllegalStateException("Perfil " + PAPEL_PADRAO + " nao cadastrado"));
        T_Funcionario funcionario = buscarFuncionario(tenant, request.funcionarioGuid());

        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String nome = request.nome().trim();

        S_Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);
        T_PerfilUsuario vinculo = usuario == null
                ? null
                : perfilUsuarioRepository.findByUsuarioIdAndTenant(usuario.getId(), tenant).orElse(null);
        if (vinculo != null && !vinculo.isDeletado()) {
            throw new RegraNegocioException("Este e-mail ja esta cadastrado nesta loja");
        }
        validarFuncionarioLivre(funcionario, null);

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
        StatusPerfilUsuario status = pendente ? StatusPerfilUsuario.PENDENTE : StatusPerfilUsuario.ATIVO;

        if (vinculo != null) { // vinculo excluido antes: reativa
            vinculo.setDeletado(false);
            vinculo.setAtivo(true);
            vinculo.setPessoa(funcionario.getPessoa());
            vinculo.setPerfil(papel);
            vinculo.setStatus(status);
            vinculo.setAdministrador(request.administrador());
        } else {
            vinculo = T_PerfilUsuario.builder()
                    .tenant(tenant).usuario(usuario).pessoa(funcionario.getPessoa()).loja(loja).perfil(papel)
                    .status(status).administrador(request.administrador()).build();
        }
        perfilUsuarioRepository.save(vinculo);

        return convite(vinculo, pendente);
    }

    @Transactional
    public UsuarioLojaResponse atualizar(UUID tenant, UUID usuarioGuid, UsuarioLojaRequest request) {
        T_PerfilUsuario vinculo = buscarVinculo(tenant, usuarioGuid);

        T_Funcionario funcionario = buscarFuncionario(tenant, request.funcionarioGuid());
        validarFuncionarioLivre(funcionario, vinculo);
        vinculo.setPessoa(funcionario.getPessoa());

        S_Usuario usuario = vinculo.getUsuario();
        usuario.setNome(request.nome().trim());
        usuarioRepository.save(usuario);

        if (request.ativo() != null) {
            vinculo.setAtivo(request.ativo());
        }
        vinculo.setAdministrador(request.administrador());
        return resposta(perfilUsuarioRepository.save(vinculo));
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

    /** Vinculo do usuario na loja; usado tambem pelo servico de foto. */
    T_PerfilUsuario buscarVinculo(UUID tenant, UUID usuarioGuid) {
        return perfilUsuarioRepository.findByUsuarioGuidAndTenantAndDeletadoFalse(usuarioGuid, tenant)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuario nao encontrado"));
    }

    private T_Funcionario buscarFuncionario(UUID tenant, UUID funcionarioGuid) {
        T_Funcionario funcionario = funcionarioRepository.findByGuidAndTenantAndDeletadoFalse(funcionarioGuid, tenant)
                .orElseThrow(() -> new RegraNegocioException("Funcionario nao encontrado"));
        if (!funcionario.isAtivo()) {
            throw new RegraNegocioException("O funcionario selecionado esta inativo");
        }
        return funcionario;
    }

    /** Um funcionario so pode ter um usuario. atual e o vinculo sendo editado (pode manter o proprio funcionario). */
    private void validarFuncionarioLivre(T_Funcionario funcionario, T_PerfilUsuario atual) {
        perfilUsuarioRepository.findFirstByPessoaIdAndDeletadoFalse(funcionario.getPessoa().getId())
                .filter(outro -> atual == null || !outro.getId().equals(atual.getId()))
                .ifPresent(outro -> {
                    throw new RegraNegocioException("Este funcionario ja possui um usuario");
                });
    }

    private UsuarioLojaResponse resposta(T_PerfilUsuario vinculo) {
        T_Funcionario funcionario = funcionarioRepository
                .findByPessoaIdIn(List.of(vinculo.getPessoa().getId())).stream().findFirst().orElse(null);
        return UsuarioLojaResponse.of(vinculo, funcionario, fotoRepository.existsByUsuarioId(vinculo.getUsuario().getId()));
    }

    private Map<Long, T_Funcionario> funcionariosPorPessoa(Collection<T_PerfilUsuario> vinculos) {
        List<Long> pessoas = vinculos.stream().map(v -> v.getPessoa().getId()).toList();
        Map<Long, T_Funcionario> mapa = new HashMap<>();
        if (!pessoas.isEmpty()) {
            funcionarioRepository.findByPessoaIdIn(pessoas).forEach(f -> mapa.put(f.getPessoa().getId(), f));
        }
        return mapa;
    }

    private Set<Long> usuariosComFoto(Collection<T_PerfilUsuario> vinculos) {
        List<Long> usuarios = vinculos.stream().map(v -> v.getUsuario().getId()).toList();
        return usuarios.isEmpty() ? Set.of() : new HashSet<>(fotoRepository.buscarUsuariosComFoto(usuarios));
    }

    private UsuarioConviteResponse convite(T_PerfilUsuario vinculo, boolean comToken) {
        S_Usuario usuario = vinculo.getUsuario();
        return new UsuarioConviteResponse(
                resposta(vinculo),
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

    private Specification<T_PerfilUsuario> especificacao(UUID tenant, FiltroUsuario filtro) {
        return (root, query, cb) -> {
            Join<T_PerfilUsuario, S_Usuario> usuario = root.join("usuario");
            Expression<String> nome = usuario.get("nome");
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
