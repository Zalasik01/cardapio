package com.cardapio.dto.pedido;

import java.math.BigDecimal;

/**
 * Números do dashboard da loja: pedidos criados no período (total, entregues, faturamento dos entregues)
 * e, de qualquer dia, quantos estão em andamento agora.
 */
public record PedidoPeriodoResumoResponse(long total, long entregues, BigDecimal faturamento, long emAndamento) {
}
