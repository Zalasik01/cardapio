package com.cardapio.dto.frete;

import java.math.BigDecimal;

public record CalculoFreteResponse(
        boolean entregavel,
        BigDecimal taxa,
        Integer tempoEstimadoMinutos,
        Double distanciaKm,
        String origem,
        String mensagem
) {
}
