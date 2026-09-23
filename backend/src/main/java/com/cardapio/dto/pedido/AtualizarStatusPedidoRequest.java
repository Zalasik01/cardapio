package com.cardapio.dto.pedido;

import com.cardapio.entity.StatusPedido;
import jakarta.validation.constraints.NotNull;

public record AtualizarStatusPedidoRequest(
        @NotNull StatusPedido status
) {
}
