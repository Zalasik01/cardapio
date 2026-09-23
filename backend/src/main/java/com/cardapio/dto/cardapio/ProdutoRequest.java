package com.cardapio.dto.cardapio;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.UUID;

public record ProdutoRequest(
        @NotNull UUID categoriaGuid,
        @NotBlank String nome,
        String descricao,
        @NotNull @Positive BigDecimal preco,
        String imagemUrl,
        Boolean disponivel,
        Integer ordemExibicao
) {
}
