package com.cardapio.dto.pedido;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * Move o pedido para uma situação do fluxo da loja. Ao cancelar, o motivo e a taxa de cancelamento são
 * opcionais (taxa vazia ou zero = sem taxa).
 */
public record AtualizarStatusPedidoRequest(
        @NotNull Long situacaoId,
        @Size(max = 500) String motivo,
        @PositiveOrZero BigDecimal taxaCancelamento
) {
}
