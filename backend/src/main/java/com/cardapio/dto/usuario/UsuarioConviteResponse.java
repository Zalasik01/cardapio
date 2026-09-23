package com.cardapio.dto.usuario;

import java.time.LocalDateTime;

/**
 * Resultado do cadastro de usuario. Quando o usuario precisa definir a senha,
 * token traz o codigo do link /novo-usuario/{token} (nulo se ele ja tinha senha).
 */
public record UsuarioConviteResponse(
        UsuarioLojaResponse usuario,
        String token,
        LocalDateTime expiraEm
) {
}
