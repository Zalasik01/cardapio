package com.cardapio.dto.auth;

public record AuthResponse(
        String token,
        Long usuarioId,
        String nome,
        String email,
        String perfil,
        Long restauranteId
) {
}
