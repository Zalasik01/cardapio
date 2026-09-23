package com.cardapio.dto.cardapio;

import jakarta.validation.constraints.NotBlank;

public record CategoriaRequest(
        @NotBlank String nome,
        Integer ordemExibicao,
        Boolean ativo
) {
}
