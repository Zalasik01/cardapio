package com.cardapio.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";
    private static final String ATRIBUTO_SENHA_TEMPORARIA = "senhaTemporariaPendente";

    private final JwtService jwtService;
    private final AppUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
            try {
                autenticar(request, authHeader.substring(BEARER_PREFIX.length()));
            } catch (JwtException | IllegalArgumentException | UsernameNotFoundException e) {
                // token invalido, expirado, de outro tipo ou de usuario inexistente: segue sem autenticar (401)
                SecurityContextHolder.clearContext();
            }
        }

        if (Boolean.TRUE.equals(request.getAttribute(ATRIBUTO_SENHA_TEMPORARIA))) {
            responderTrocaDeSenhaObrigatoria(response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    /** Enquanto a senha for temporaria, so a autenticacao e a propria troca de senha sao permitidas. */
    private boolean liberadoComSenhaTemporaria(HttpServletRequest request) {
        String caminho = request.getRequestURI();
        return caminho.startsWith("/api/auth/") || caminho.equals("/api/perfil/senha");
    }

    private void responderTrocaDeSenhaObrigatoria(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"status\":403,\"erro\":\"Forbidden\","
                + "\"mensagem\":\"Defina uma nova senha antes de continuar\",\"codigo\":\"SENHA_TEMPORARIA\"}");
    }

    private void autenticar(HttpServletRequest request, String token) {
        Claims claims = jwtService.lerAccessToken(token);

        AppUserDetails carregado = (AppUserDetails) userDetailsService.loadUserByUsername(claims.getSubject());
        if (!carregado.isEnabled()) {
            return;
        }

        String tenantClaim = claims.get("tenant", String.class);
        UUID tenant = tenantClaim != null ? UUID.fromString(tenantClaim) : null;
        AppUserDetails contexto = new AppUserDetails(carregado.getUsuario(), tenant, claims.get("perfil", String.class));

        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                contexto, null, contexto.getAuthorities());
        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authToken);
        if (carregado.getUsuario().isExigeTrocarSenha() && !liberadoComSenhaTemporaria(request)) {
            request.setAttribute(ATRIBUTO_SENHA_TEMPORARIA, Boolean.TRUE);
        }
    }
}
