package com.cardapio.dto.pedido;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record ItemPedidoRequest(
        @NotNull UUID produtoGuid,
        @NotNull @Positive Integer quantidade,
        String observacoes
) {
}
