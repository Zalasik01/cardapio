package com.cardapio.dto.frete;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record ZonaEntregaRequest(
        @NotBlank String bairro,
        @NotNull @PositiveOrZero BigDecimal taxa,
        Integer tempoEstimadoMinutos,
        Boolean ativo
) {
}
