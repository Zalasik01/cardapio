package com.cardapio.dto.frete;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Bairro e usado primeiro (taxa fixa); se nao houver zona cadastrada
 * e as coordenadas forem informadas, o frete e calculado por distancia.
 */
public record CalculoFreteRequest(
        @NotNull UUID tenant,
        String bairro,
        Double latitude,
        Double longitude
) {
}
