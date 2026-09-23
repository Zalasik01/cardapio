package com.cardapio.service;

import com.cardapio.dto.auth.AuthResponse;
import com.cardapio.dto.auth.LoginRequest;
import com.cardapio.dto.auth.RegistroClienteRequest;
import com.cardapio.entity.Perfil;
import com.cardapio.entity.Usuario;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.UsuarioRepository;
import com.cardapio.security.AppUserDetails;
import com.cardapio.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse registrarCliente(RegistroClienteRequest request) {
        if (usuarioRepository.existsByEmail(request.email())) {
            throw new RegraNegocioException("Ja existe uma conta cadastrada com este email");
        }

        Usuario usuario = Usuario.builder()
                .nome(request.nome())
                .email(request.email())
                .senha(passwordEncoder.encode(request.senha()))
                .telefone(request.telefone())
                .perfil(Perfil.ROLE_CLIENTE)
                .build();

        usuarioRepository.save(usuario);
        return gerarResposta(usuario);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.senha()));

        Usuario usuario = usuarioRepository.findByEmail(request.email())
                .orElseThrow(() -> new RegraNegocioException("Email ou senha invalidos"));

        return gerarResposta(usuario);
    }

    private AuthResponse gerarResposta(Usuario usuario) {
        AppUserDetails userDetails = new AppUserDetails(usuario);
        String token = jwtService.generateToken(userDetails, Map.of(
                "perfil", usuario.getPerfil().name(),
                "restauranteId", usuario.getRestaurante() != null ? usuario.getRestaurante().getId() : ""
        ));

        return new AuthResponse(
                token, usuario.getId(), usuario.getNome(), usuario.getEmail(),
                usuario.getPerfil().name(),
                usuario.getRestaurante() != null ? usuario.getRestaurante().getId() : null);
    }
}
