package com.cardapio.service;

import com.cardapio.dto.auth.AuthResponse;
import com.cardapio.dto.auth.LoginRequest;
import com.cardapio.dto.auth.RegistroClienteRequest;
import com.cardapio.entity.S_Perfil;
import com.cardapio.entity.S_Usuario;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.S_PerfilRepository;
import com.cardapio.repository.S_UsuarioRepository;
import com.cardapio.security.AppUserDetails;
import com.cardapio.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    public static final String PERFIL_CLIENTE = "ROLE_CLIENTE";

    private final S_UsuarioRepository usuarioRepository;
    private final S_PerfilRepository perfilRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse registrarCliente(RegistroClienteRequest request) {
        if (usuarioRepository.existsByEmail(request.email())) {
            throw new RegraNegocioException("Ja existe uma conta cadastrada com este email");
        }

        S_Perfil perfilCliente = perfilRepository.findByCodigo(PERFIL_CLIENTE)
                .orElseThrow(() -> new IllegalStateException("Perfil " + PERFIL_CLIENTE + " nao cadastrado"));

        S_Usuario usuario = S_Usuario.builder()
                .nome(request.nome())
                .email(request.email())
                .senha(passwordEncoder.encode(request.senha()))
                .perfil(perfilCliente)
                .build();

        usuarioRepository.save(usuario);
        return gerarResposta(usuario);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.senha()));

        S_Usuario usuario = usuarioRepository.findByEmail(request.email())
                .orElseThrow(() -> new RegraNegocioException("Email ou senha invalidos"));

        usuario.setDataUltimoAcesso(Instant.now());
        usuarioRepository.save(usuario);

        return gerarResposta(usuario);
    }

    private AuthResponse gerarResposta(S_Usuario usuario) {
        AppUserDetails userDetails = new AppUserDetails(usuario);

        Map<String, Object> claims = new HashMap<>();
        claims.put("perfil", usuario.getPerfil().getCodigo());
        if (usuario.getTenant() != null) {
            claims.put("tenant", usuario.getTenant().toString());
        }

        String token = jwtService.generateToken(userDetails, claims);

        return new AuthResponse(
                token, usuario.getId(), usuario.getNome(), usuario.getEmail(),
                usuario.getPerfil().getCodigo(), usuario.getTenant());
    }
}
