package com.cardapio.dto.restaurante;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record RestauranteRequest(
        @NotBlank String nome,
        @NotBlank String slug,
        String descricao,
        String telefone,
        String logoUrl,
        String enderecoRua,
        String enderecoNumero,
        String enderecoBairro,
        String enderecoCidade,
        String enderecoEstado,
        String enderecoCep,
        Double latitude,
        Double longitude,
        @PositiveOrZero BigDecimal taxaEntregaBase,
        @PositiveOrZero BigDecimal taxaEntregaPorKm,
        Double distanciaMaximaEntregaKm,
        @PositiveOrZero BigDecimal valorMinimoPedido
) {
}
