package com.cardapio.dto.frete;

import com.cardapio.entity.ZonaEntrega;

import java.math.BigDecimal;

public record ZonaEntregaResponse(
        Long id,
        String bairro,
        BigDecimal taxa,
        Integer tempoEstimadoMinutos,
        boolean ativo
) {
    public static ZonaEntregaResponse of(ZonaEntrega z) {
        return new ZonaEntregaResponse(z.getId(), z.getBairro(), z.getTaxa(), z.getTempoEstimadoMinutos(), z.isAtivo());
    }
}
