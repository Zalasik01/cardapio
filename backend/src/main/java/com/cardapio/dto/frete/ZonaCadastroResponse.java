package com.cardapio.dto.frete;

import com.cardapio.entity.T_ZonaEntrega;

import java.math.BigDecimal;

public record ZonaCadastroResponse(
        Long id,
        String bairro,
        BigDecimal taxa,
        Integer tempoEstimadoMinutos,
        boolean ativo
) {

    public static ZonaCadastroResponse of(T_ZonaEntrega z) {
        return new ZonaCadastroResponse(z.getId(), z.getBairro(), z.getTaxa(), z.getTempoEstimadoMinutos(), z.isAtivo());
    }
}
