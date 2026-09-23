package com.cardapio.dto.auth;

import com.cardapio.dto.loja.LojaResponse;

/**
 * Resposta de login, selecao de loja e renovacao de token.
 *
 * Quando {@code loja} e nula a sessao ainda nao esta vinculada a uma loja: o
 * cliente deve listar as lojas (GET /api/auth/lojas) e o usuario escolher uma
 * (POST /api/auth/selecionar-loja).
 */
public record AuthResponse(
        String accessToken,
        String refreshToken,
        UsuarioLogadoResponse usuarioLogado,
        LojaResponse loja
) {
}
