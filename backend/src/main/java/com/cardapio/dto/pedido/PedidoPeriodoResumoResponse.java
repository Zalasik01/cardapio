package com.cardapio.dto.pedido;

import java.math.BigDecimal;

/**
 * Números do dashboard da loja: pedidos criados no período (total, entregues, faturamento dos entregues),
 * de qualquer dia quantos estão em andamento agora e, entre os entregues com prazo de preparo, quantos foram no prazo
 * (noPrazoPercentual, nulo quando não há pedidos com prazo) e o atraso médio em minutos (só dos atrasados).
 */
public record PedidoPeriodoResumoResponse(long total, long entregues, BigDecimal faturamento, long emAndamento,
                                          Integer noPrazoPercentual, long atrasoMedioMinutos) {
}
