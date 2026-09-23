package com.cardapio.dto.restaurante;

import com.cardapio.entity.Restaurante;

import java.math.BigDecimal;

public record RestauranteResponse(
        Long id,
        String nome,
        String slug,
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
        BigDecimal taxaEntregaBase,
        BigDecimal taxaEntregaPorKm,
        Double distanciaMaximaEntregaKm,
        BigDecimal valorMinimoPedido,
        boolean ativo
) {
    public static RestauranteResponse of(Restaurante r) {
        return new RestauranteResponse(
                r.getId(), r.getNome(), r.getSlug(), r.getDescricao(), r.getTelefone(), r.getLogoUrl(),
                r.getEnderecoRua(), r.getEnderecoNumero(), r.getEnderecoBairro(), r.getEnderecoCidade(),
                r.getEnderecoEstado(), r.getEnderecoCep(), r.getLatitude(), r.getLongitude(),
                r.getTaxaEntregaBase(), r.getTaxaEntregaPorKm(), r.getDistanciaMaximaEntregaKm(),
                r.getValorMinimoPedido(), r.isAtivo());
    }
}
