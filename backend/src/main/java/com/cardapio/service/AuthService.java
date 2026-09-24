package com.cardapio.service;

import com.cardapio.dto.auth.AuthResponse;
import com.cardapio.dto.auth.LoginRequest;
import com.cardapio.dto.auth.UsuarioLogadoResponse;
import com.cardapio.dto.loja.LojaResponse;
import com.cardapio.entity.S_Loja;
import com.cardapio.entity.S_Usuario;
import com.cardapio.entity.T_PerfilUsuario;
import com.cardapio.repository.S_LojaRepository;
import com.cardapio.repository.S_UsuarioFotoRepository;
import com.cardapio.repository.S_UsuarioRepository;
import com.cardapio.repository.T_PerfilUsuarioRepository;
import com.cardapio.security.AppUserDetails;
import com.cardapio.security.JwtService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Autenticacao e escolha da loja.
 *
 * Regras de acesso as lojas:
 * - usuario de suporte SEM perfil vinculado e "usuario do sistema": enxerga
 *   todas as lojas ativas e atua nelas como ROLE_SUPER_ADMIN;
 * - qualquer outro usuario so acessa as lojas em que tem um t_perfil_usuario,
 *   com o papel definido nesse perfil.
 * Se o usuario (que nao e do sistema) tem uma unica loja, ela ja e selecionada no login.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    public static final String PAPEL_SISTEMA = "ROLE_SUPER_ADMIN";

    private final S_UsuarioRepository usuarioRepository;
    private final S_LojaRepository lojaRepository;
    private final T_PerfilUsuarioRepository perfilUsuarioRepository;
    private final S_UsuarioFotoRepository fotoRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.senha()));

        return iniciarSessao(buscarPorEmail(request.email()));
    }

    /** Registra o acesso e cria a sessao (usado no login e apos definir a senha do novo usuario). */
    @Transactional
    public AuthResponse iniciarSessao(S_Usuario usuario) {
        usuario.setDataUltimoAcesso(LocalDateTime.now().withNano(0));
        usuarioRepository.save(usuario);
        return criarSessao(usuario, null);
    }

    /**
     * Lojas que o usuario pode acessar (todas as ativas, para o usuario do sistema),
     * opcionalmente filtradas por parte do nome.
     */
    @Transactional(readOnly = true)
    public List<LojaResponse> listarLojasAcessiveis(Long usuarioId, String busca) {
        S_Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new AccessDeniedException("Usuário não encontrado"));
        List<T_PerfilUsuario> perfis = perfilUsuarioRepository.buscarAtivosPorUsuario(usuarioId);
        boolean usuarioSistema = ehUsuarioDoSistema(usuario, perfis);
        String termo = busca == null ? "" : busca.trim();

        List<S_Loja> lojas;
        if (usuarioSistema && !termo.isEmpty()) {
            lojas = lojaRepository.findByAtivoTrueAndDeletadoFalseAndNomeContainingIgnoreCaseOrderByNomeAsc(termo);
        } else {
            lojas = lojasAcessiveis(usuarioSistema, perfis).stream()
                    .filter(loja -> loja.getNome().toLowerCase().contains(termo.toLowerCase()))
                    .toList();
        }
        return lojas.stream().map(LojaResponse::of).toList();
    }

    @Transactional(readOnly = true)
    public AuthResponse selecionarLoja(Long usuarioId, UUID lojaGuid) {
        S_Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new AccessDeniedException("Usuário não encontrado"));
        return criarSessao(usuario, lojaGuid);
    }

    /** Troca um refresh token valido por um novo par de tokens, mantendo a loja da sessao. */
    @Transactional(readOnly = true)
    public AuthResponse renovar(String refreshToken) {
        Claims claims = jwtService.lerRefreshToken(refreshToken);
        S_Usuario usuario = buscarPorEmail(claims.getSubject());
        if (!usuario.isAtivo() || usuario.isDeletado()) {
            throw new AccessDeniedException("Usuário inativo");
        }

        String tenant = claims.get("tenant", String.class);
        return criarSessao(usuario, tenant != null ? UUID.fromString(tenant) : null);
    }

    /**
     * Monta a sessao. Com lojaGuid, exige que o usuario tenha acesso a ela; sem
     * lojaGuid, so vincula uma loja automaticamente quando o usuario tem apenas uma.
     */
    private AuthResponse criarSessao(S_Usuario usuario, UUID lojaGuid) {
        List<T_PerfilUsuario> perfis = perfilUsuarioRepository.buscarAtivosPorUsuario(usuario.getId());
        boolean usuarioSistema = ehUsuarioDoSistema(usuario, perfis);
        List<S_Loja> lojas = lojasAcessiveis(usuarioSistema, perfis);

        S_Loja loja = null;
        if (lojaGuid != null) {
            loja = lojas.stream()
                    .filter(l -> l.getGuid().equals(lojaGuid))
                    .findFirst()
                    .orElseThrow(() -> new AccessDeniedException("Você não tem acesso a esta loja"));
        } else if (!usuarioSistema && lojas.size() == 1) {
            loja = lojas.get(0);
        }

        String papel = definirPapel(usuarioSistema, perfis, loja);

        Map<String, Object> claims = new HashMap<>();
        claims.put("perfil", papel);
        if (loja != null) {
            claims.put("tenant", loja.getGuid().toString());
        }

        return new AuthResponse(
                jwtService.gerarAccessToken(usuario.getEmail(), claims),
                jwtService.gerarRefreshToken(usuario.getEmail(), claims),
                UsuarioLogadoResponse.of(usuario, papel, fotoRepository.existsByUsuarioId(usuario.getId())),
                loja != null ? LojaResponse.of(loja) : null);
    }

    private String definirPapel(boolean usuarioSistema, List<T_PerfilUsuario> perfis, S_Loja loja) {
        if (usuarioSistema) {
            return PAPEL_SISTEMA;
        }
        if (loja == null) {
            return AppUserDetails.PAPEL_USUARIO;
        }
        return perfis.stream()
                .filter(p -> p.getLoja().getId().equals(loja.getId()))
                .map(p -> p.getPerfil().getCodigo())
                .findFirst()
                .orElse(AppUserDetails.PAPEL_USUARIO);
    }

    private S_Usuario buscarPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("Usuário não encontrado"));
    }

    private boolean ehUsuarioDoSistema(S_Usuario usuario, List<T_PerfilUsuario> perfis) {
        return usuario.isUsuarioSuporte() && perfis.isEmpty();
    }

    private List<S_Loja> lojasAcessiveis(boolean usuarioSistema, List<T_PerfilUsuario> perfis) {
        if (usuarioSistema) {
            return lojaRepository.findByAtivoTrueAndDeletadoFalseOrderByNomeAsc();
        }
        return perfis.stream().map(T_PerfilUsuario::getLoja).toList();
    }
}
