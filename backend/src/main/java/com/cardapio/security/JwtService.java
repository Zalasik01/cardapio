package com.cardapio.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Emite e valida os dois tokens da sessao: o access token (curta duracao, usado
 * nas requisicoes) e o refresh token (longa duracao, so serve para renovar).
 * O claim "tipo" impede usar um no lugar do outro.
 */
@Service
public class JwtService {

    private static final String CLAIM_TIPO = "tipo";
    private static final String TIPO_ACCESS = "access";
    private static final String TIPO_REFRESH = "refresh";
    private static final String TIPO_CLIENTE = "cliente";
    private static final long CLIENTE_EXPIRACAO_MS = 30L * 24 * 60 * 60 * 1000;

    private final SecretKey key;
    private final long accessExpirationMs;
    private final long refreshExpirationMs;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                       @Value("${app.jwt.expiration-ms}") long accessExpirationMs,
                       @Value("${app.jwt.refresh-expiration-ms}") long refreshExpirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessExpirationMs = accessExpirationMs;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    public String gerarAccessToken(String email, Map<String, Object> claims) {
        return gerar(email, claims, TIPO_ACCESS, accessExpirationMs);
    }

    public String gerarRefreshToken(String email, Map<String, Object> claims) {
        return gerar(email, claims, TIPO_REFRESH, refreshExpirationMs);
    }

    /** Token do cliente final (cardápio online): não vale para o painel, pois o tipo é outro. Subject = id da conta. */
    public String gerarTokenCliente(Long contaId) {
        return gerar(String.valueOf(contaId), Map.of(), TIPO_CLIENTE, CLIENTE_EXPIRACAO_MS);
    }

    /** Devolve o id da conta do cliente; lança JwtException se o token for inválido, vencido ou de outro tipo. */
    public Long lerTokenCliente(String token) {
        try {
            return Long.valueOf(ler(token, TIPO_CLIENTE).getSubject());
        } catch (NumberFormatException e) {
            throw new JwtException("Token inválido");
        }
    }

    /** Valida assinatura, validade e tipo access. Lanca JwtException se invalido. */
    public Claims lerAccessToken(String token) {
        return ler(token, TIPO_ACCESS);
    }

    /** Valida assinatura, validade e tipo refresh. Lanca JwtException se invalido. */
    public Claims lerRefreshToken(String token) {
        return ler(token, TIPO_REFRESH);
    }

    private String gerar(String email, Map<String, Object> claims, String tipo, long expirationMs) {
        Map<String, Object> todos = new HashMap<>(claims);
        todos.put(CLAIM_TIPO, tipo);
        Date agora = new Date();
        return Jwts.builder()
                .claims(todos)
                .subject(email)
                .issuedAt(agora)
                .expiration(new Date(agora.getTime() + expirationMs))
                .signWith(key)
                .compact();
    }

    private Claims ler(String token, String tipoEsperado) {
        Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
        if (!tipoEsperado.equals(claims.get(CLAIM_TIPO, String.class))) {
            throw new JwtException("Tipo de token inválido");
        }
        return claims;
    }
}
