package com.cardapio.dto.loja;

import com.cardapio.entity.TipoOrganizacao;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record LojaRequest(
        @NotBlank String nome,
        @NotBlank String slug,
        @NotNull TipoOrganizacao tipoOrganizacao,
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
