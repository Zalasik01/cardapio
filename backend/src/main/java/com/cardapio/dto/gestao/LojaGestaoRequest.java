package com.cardapio.dto.gestao;

import com.cardapio.entity.SituacaoConta;
import com.cardapio.entity.TipoOrganizacao;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/** Cadastro/edição de uma loja pela Gestão Interna. O slug é o endereço público da loja. */
public record LojaGestaoRequest(
        Boolean ativo,
        @NotBlank @Size(max = 255) String nome,
        @NotBlank @Size(max = 255)
        @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$", message = "Use apenas letras minúsculas, números e hífens (ex.: minha-loja)")
        String slug,
        @NotNull TipoOrganizacao tipoOrganizacao,
        @NotNull SituacaoConta situacaoConta,
        @Size(max = 255) String descricao,
        @Size(max = 255) String telefone,
        @Size(max = 255) String logoUrl,
        @Size(max = 255) String enderecoRua,
        @Size(max = 255) String enderecoNumero,
        @Size(max = 255) String enderecoBairro,
        @Size(max = 255) String enderecoCidade,
        @Size(max = 2) String enderecoEstado,
        @Size(max = 9) String enderecoCep,
        Double latitude,
        Double longitude,
        @PositiveOrZero BigDecimal taxaEntregaBase,
        @PositiveOrZero BigDecimal taxaEntregaPorKm,
        @PositiveOrZero Double distanciaMaximaEntregaKm,
        @PositiveOrZero BigDecimal valorMinimoPedido
) {
}
