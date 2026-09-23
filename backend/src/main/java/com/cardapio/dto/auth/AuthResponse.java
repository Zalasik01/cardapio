package com.cardapio.dto.auth;

import java.util.UUID;

public record AuthResponse(
        String token,
        Long usuarioId,
        String nome,
        String email,
        String perfil,
        UUID tenant
) {
}
