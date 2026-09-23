package com.cardapio.dto.loja;

import com.cardapio.entity.S_Loja;

import java.math.BigDecimal;
import java.util.UUID;

public record LojaResponse(
        Long id,
        UUID tenant,
        String nome,
        String slug,
        String situacaoConta,
        String tipoOrganizacao,
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
    public static LojaResponse of(S_Loja l) {
        return new LojaResponse(
                l.getId(), l.getGuid(), l.getNome(), l.getSlug(), l.getSituacaoConta().name(), l.getTipoOrganizacao().name(),
                l.getDescricao(), l.getTelefone(), l.getLogoUrl(),
                l.getEnderecoRua(), l.getEnderecoNumero(), l.getEnderecoBairro(), l.getEnderecoCidade(),
                l.getEnderecoEstado(), l.getEnderecoCep(), l.getLatitude(), l.getLongitude(),
                l.getTaxaEntregaBase(), l.getTaxaEntregaPorKm(), l.getDistanciaMaximaEntregaKm(),
                l.getValorMinimoPedido(), l.isAtivo());
    }
}
