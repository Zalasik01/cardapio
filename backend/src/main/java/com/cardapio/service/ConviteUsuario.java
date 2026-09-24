package com.cardapio.service;

import com.cardapio.entity.S_Usuario;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

/**
 * Link de convite (/novo-usuario/{token}) para quem ainda não definiu a senha. Compartilhado
 * pelos usuários de loja e pelos usuários internos da plataforma.
 */
@Component
public class ConviteUsuario {

    static final long VALIDADE_HORAS = 72;
    private static final SecureRandom RANDOM = new SecureRandom();

    /** Gera um novo token com validade e obriga o usuário a definir a senha pelo link. */
    public void preparar(S_Usuario usuario) {
        usuario.setEsqueciSenhaToken(gerarToken());
        usuario.setEsqueciSenhaExpiraEm(LocalDateTime.now().withNano(0).plusHours(VALIDADE_HORAS));
        usuario.setExigeTrocarSenha(true);
    }

    public String gerarToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
