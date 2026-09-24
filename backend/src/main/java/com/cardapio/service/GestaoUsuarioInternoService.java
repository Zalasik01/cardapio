package com.cardapio.service;

import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.gestao.FiltroUsuarioInterno;
import com.cardapio.dto.gestao.UsuarioInternoConviteResponse;
import com.cardapio.dto.gestao.UsuarioInternoRequest;
import com.cardapio.dto.gestao.UsuarioInternoResponse;
import com.cardapio.entity.S_Usuario;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.S_UsuarioRepository;
import com.cardapio.security.PoliticaSenha;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Gestão Interna: usuários internos da plataforma (a equipe que atende as lojas). Não têm vínculo com
 * loja: são usuários de suporte (enxergam todas as lojas) e, opcionalmente, administradores da plataforma.
 * Só o usuário administrador acessa (SecurityConfig). O usuário novo nasce sem senha e recebe um link
 * /novo-usuario/{token} para defini-la, como os usuários de loja.
 */
@Service
@RequiredArgsConstructor
public class GestaoUsuarioInternoService {

    private static final int TAMANHO_MAXIMO_PAGINA = 50;

    private final S_UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final ConviteUsuario convites;

    @Transactional(readOnly = true)
    public PaginaResponse<UsuarioInternoResponse> buscar(FiltroUsuarioInterno filtro, int pagina, int tamanho) {
        int tamanhoLimitado = Math.min(Math.max(tamanho, 1), TAMANHO_MAXIMO_PAGINA);
        var resultado = usuarioRepository.findAll(especificacao(filtro), PageRequest.of(Math.max(pagina, 0), tamanhoLimitado));
        return PaginaResponse.of(resultado, UsuarioInternoResponse::of);
    }

    @Transactional(readOnly = true)
    public UsuarioInternoResponse obter(Long id) {
        return UsuarioInternoResponse.of(buscarUsuario(id));
    }

    @Transactional
    public UsuarioInternoConviteResponse criar(UsuarioInternoRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (usuarioRepository.existsByEmail(email)) {
            throw new RegraNegocioException("Este e-mail já está em uso");
        }
        S_Usuario usuario = S_Usuario.builder()
                .nome(request.nome().trim())
                .email(email)
                .senha(passwordEncoder.encode(UUID.randomUUID() + convites.gerarToken())) // inutilizável até o convite
                .usuarioSuporte(true)
                .usuarioAdministrador(request.administrador())
                .build();
        convites.preparar(usuario);
        return convite(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioInternoResponse atualizar(Long id, UsuarioInternoRequest request, Long usuarioLogadoId) {
        S_Usuario usuario = buscarUsuario(id);
        boolean proprio = usuario.getId().equals(usuarioLogadoId);
        if (proprio && !request.administrador()) {
            throw new RegraNegocioException("Você não pode retirar o seu próprio acesso de administrador");
        }
        if (proprio && Boolean.FALSE.equals(request.ativo())) {
            throw new RegraNegocioException("Você não pode inativar o próprio usuário");
        }
        usuario.setNome(request.nome().trim());
        usuario.setUsuarioAdministrador(request.administrador());
        if (request.ativo() != null) {
            usuario.setAtivo(request.ativo());
        }
        return UsuarioInternoResponse.of(usuarioRepository.save(usuario));
    }

    /** Altera o e-mail de login. As sessões abertas desse usuário deixam de valer (o token o identifica pelo e-mail). */
    @Transactional
    public UsuarioInternoResponse alterarEmail(Long id, String novoEmail) {
        S_Usuario usuario = buscarUsuario(id);
        String email = novoEmail.trim().toLowerCase(Locale.ROOT);
        if (!email.equals(usuario.getEmail())) {
            if (usuarioRepository.existsByEmail(email)) {
                throw new RegraNegocioException("Este e-mail já está em uso");
            }
            usuario.setEmail(email);
            usuarioRepository.save(usuario);
        }
        return UsuarioInternoResponse.of(usuario);
    }

    /** Define uma senha temporária e obriga a troca no próximo acesso. Quem ainda não definiu a senha usa o link. */
    @Transactional
    public UsuarioInternoResponse redefinirSenha(Long id, String senhaTemporaria, Long usuarioLogadoId) {
        S_Usuario usuario = buscarUsuario(id);
        if (usuario.getId().equals(usuarioLogadoId)) {
            throw new RegraNegocioException("Para alterar a própria senha use \"Seu perfil\"");
        }
        if (usuario.getEsqueciSenhaToken() != null) {
            throw new RegraNegocioException("O usuário ainda não definiu a senha: gere um novo link de acesso");
        }
        PoliticaSenha.validar(senhaTemporaria, usuario.getEmail(), usuario.getNome());

        usuario.setSenha(passwordEncoder.encode(senhaTemporaria));
        usuario.setExigeTrocarSenha(true);
        usuario.setEsqueciSenhaToken(null);
        usuario.setEsqueciSenhaExpiraEm(null);
        return UsuarioInternoResponse.of(usuarioRepository.save(usuario));
    }

    /** Ativa/inativa o usuário. Ninguém inativa o próprio usuário (perderia o acesso na hora). */
    @Transactional
    public UsuarioInternoResponse alterarAtivo(Long id, boolean ativo, Long usuarioLogadoId) {
        S_Usuario usuario = buscarUsuario(id);
        if (!ativo && usuario.getId().equals(usuarioLogadoId)) {
            throw new RegraNegocioException("Você não pode inativar o próprio usuário");
        }
        usuario.setAtivo(ativo);
        return UsuarioInternoResponse.of(usuarioRepository.save(usuario));
    }

    /** Exclusão lógica. Libera o e-mail para um novo cadastro (o e-mail antigo fica registrado no próprio campo). */
    @Transactional
    public void excluir(Long id, Long usuarioLogadoId) {
        S_Usuario usuario = buscarUsuario(id);
        if (usuario.getId().equals(usuarioLogadoId)) {
            throw new RegraNegocioException("Você não pode excluir o próprio usuário");
        }
        usuario.setEmail(usuario.getEmail() + ".excluido." + usuario.getId());
        usuario.setDeletado(true);
        usuario.setAtivo(false);
        usuario.setEsqueciSenhaToken(null);
        usuario.setEsqueciSenhaExpiraEm(null);
        usuarioRepository.save(usuario);
    }

    /** Gera um novo link para um usuário que ainda não definiu a senha. */
    @Transactional
    public UsuarioInternoConviteResponse gerarNovoLink(Long id) {
        S_Usuario usuario = buscarUsuario(id);
        if (!usuario.isExigeTrocarSenha() || usuario.getEsqueciSenhaToken() == null) {
            throw new RegraNegocioException("Este usuário já definiu a senha");
        }
        convites.preparar(usuario);
        return convite(usuarioRepository.save(usuario));
    }

    private UsuarioInternoConviteResponse convite(S_Usuario usuario) {
        return new UsuarioInternoConviteResponse(
                UsuarioInternoResponse.of(usuario), usuario.getEsqueciSenhaToken(), usuario.getEsqueciSenhaExpiraEm());
    }

    /** Só existem, para esta tela, os usuários internos: os de suporte ou administradores. */
    private S_Usuario buscarUsuario(Long id) {
        return usuarioRepository.findById(id)
                .filter(u -> !u.isDeletado() && (u.isUsuarioSuporte() || u.isUsuarioAdministrador()))
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado"));
    }

    private Specification<S_Usuario> especificacao(FiltroUsuarioInterno filtro) {
        return (root, query, cb) -> {
            List<Predicate> filtros = new ArrayList<>();
            filtros.add(cb.isFalse(root.get("deletado")));
            filtros.add(cb.or(cb.isTrue(root.get("usuarioSuporte")), cb.isTrue(root.get("usuarioAdministrador"))));
            // por padrão só lista usuários ativos; "Mostrar inativos" inclui os demais
            if (!filtro.mostrarInativos()) {
                filtros.add(cb.isTrue(root.get("ativo")));
            }
            if (filtro.busca() != null && !filtro.busca().isBlank()) {
                String padrao = "%" + filtro.busca().trim().toLowerCase(Locale.ROOT)
                        .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                filtros.add(cb.or(
                        cb.like(cb.lower(root.get("nome")), padrao, '\\'),
                        cb.like(cb.lower(root.get("email")), padrao, '\\')));
            }
            if (filtro.administrador() != null) {
                filtros.add(cb.equal(root.get("usuarioAdministrador"), filtro.administrador()));
            }
            if (query.getResultType() != Long.class) {
                query.orderBy(cb.asc(cb.lower(root.get("nome"))));
            }
            return cb.and(filtros.toArray(new Predicate[0]));
        };
    }
}
