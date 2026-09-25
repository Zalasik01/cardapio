package com.cardapio.dto.frete;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/** Cadastro/edição de zona de entrega: o bairro, a taxa cobrada e o tempo estimado (padrão: 45 minutos). */
public record ZonaCadastroRequest(
        @NotBlank @Size(max = 255) String bairro,
        @NotNull @PositiveOrZero BigDecimal taxa,
        @Positive Integer tempoEstimadoMinutos,
        Boolean ativo
) {
}
