package com.cardapio.security;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Hash de senha em SHA-256, conforme convencao da s_usuario (coluna "senha").
 * SHA-256 e um hash rapido (sem salt/custo configuravel) e portanto mais
 * fraco contra ataques de forca bruta do que BCrypt/Argon2; mantido aqui
 * apenas para seguir a especificacao de dados combinada com o time.
 */
@Component
public class Sha256PasswordEncoder implements PasswordEncoder {

    @Override
    public String encode(CharSequence rawPassword) {
        return sha256(rawPassword.toString());
    }

    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        return sha256(rawPassword.toString()).equalsIgnoreCase(encodedPassword);
    }

    private String sha256(String valor) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(valor.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Algoritmo SHA-256 indisponível", e);
        }
    }
}
