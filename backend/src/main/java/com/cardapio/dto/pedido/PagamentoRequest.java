package com.cardapio.dto.pedido;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

/**
 * Uma parte do pagamento do pedido: a forma, quanto do pedido ela paga e, no dinheiro, quanto o cliente entregou
 * (valorRecebido, para calcular o troco).
 */
public record PagamentoRequest(
        @NotNull Long formaId,
        @NotNull @Positive BigDecimal valor,
        @PositiveOrZero BigDecimal valorRecebido
) {
}
