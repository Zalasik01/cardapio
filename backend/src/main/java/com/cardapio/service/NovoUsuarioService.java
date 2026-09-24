package com.cardapio.service;

import com.cardapio.dto.auth.AuthResponse;
import com.cardapio.dto.auth.ConviteInfoResponse;
import com.cardapio.entity.S_Usuario;
import com.cardapio.entity.StatusPerfilUsuario;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.repository.S_UsuarioRepository;
import com.cardapio.repository.T_PerfilUsuarioRepository;
import com.cardapio.security.PoliticaSenha;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Fluxo do link /novo-usuario/{token}: o usuario convidado define a senha, seus
 * vinculos PENDENTES viram ATIVOS e ele ja entra no sistema.
 */
@Service
@RequiredArgsConstructor
public class NovoUsuarioService {

    private static final String LINK_INVALIDO = "Link inválido ou expirado. Peça um novo link ao administrador.";

    private final S_UsuarioRepository usuarioRepository;
    private final T_PerfilUsuarioRepository perfilUsuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public ConviteInfoResponse consultar(String token) {
        S_Usuario usuario = buscarPorToken(token);
        return new ConviteInfoResponse(usuario.getNome(), usuario.getEmail());
    }

    @Transactional
    public AuthResponse definirSenha(String token, String senha) {
        S_Usuario usuario = buscarPorToken(token);
        PoliticaSenha.validar(senha, usuario.getEmail(), usuario.getNome());

        usuario.setSenha(passwordEncoder.encode(senha));
        usuario.setExigeTrocarSenha(false);
        usuario.setEsqueciSenhaToken(null); // o link so vale uma vez
        usuario.setEsqueciSenhaExpiraEm(null);
        usuarioRepository.save(usuario);

        perfilUsuarioRepository.findByUsuarioIdAndDeletadoFalse(usuario.getId()).stream()
                .filter(vinculo -> vinculo.getStatus() == StatusPerfilUsuario.PENDENTE)
                .forEach(vinculo -> {
                    vinculo.setStatus(StatusPerfilUsuario.ATIVO);
                    perfilUsuarioRepository.save(vinculo);
                });

        return authService.iniciarSessao(usuario);
    }

    private S_Usuario buscarPorToken(String token) {
        S_Usuario usuario = usuarioRepository.findByEsqueciSenhaToken(token)
                .orElseThrow(() -> new RecursoNaoEncontradoException(LINK_INVALIDO));
        boolean expirado = usuario.getEsqueciSenhaExpiraEm() == null
                || usuario.getEsqueciSenhaExpiraEm().isBefore(LocalDateTime.now());
        if (expirado || !usuario.isExigeTrocarSenha() || !usuario.isAtivo() || usuario.isDeletado()) {
            throw new RecursoNaoEncontradoException(LINK_INVALIDO);
        }
        return usuario;
    }
}
