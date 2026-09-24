package com.cardapio.dto.gestao;

import java.time.LocalDateTime;

/** Resultado do cadastro (ou do novo link): token é o código do link /novo-usuario/{token}. */
public record UsuarioInternoConviteResponse(
        UsuarioInternoResponse usuario,
        String token,
        LocalDateTime expiraEm
) {
}
