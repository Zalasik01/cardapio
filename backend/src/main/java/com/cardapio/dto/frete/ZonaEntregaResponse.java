package com.cardapio.dto.frete;

import com.cardapio.entity.T_ZonaEntrega;

import java.math.BigDecimal;
import java.util.UUID;

public record ZonaEntregaResponse(
        UUID guid,
        String bairro,
        BigDecimal taxa,
        Integer tempoEstimadoMinutos,
        boolean ativo
) {
    public static ZonaEntregaResponse of(T_ZonaEntrega z) {
        return new ZonaEntregaResponse(z.getGuid(), z.getBairro(), z.getTaxa(), z.getTempoEstimadoMinutos(), z.isAtivo());
    }
}
