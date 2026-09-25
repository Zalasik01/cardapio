package com.cardapio.dto.pedido;

import com.cardapio.entity.StatusPedido;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * Muda a situação do pedido. Ao cancelar, o motivo e a taxa de cancelamento são opcionais
 * (taxa vazia ou zero = sem taxa).
 */
public record AtualizarStatusPedidoRequest(
        @NotNull StatusPedido status,
        @Size(max = 500) String motivo,
        @PositiveOrZero BigDecimal taxaCancelamento
) {
}
