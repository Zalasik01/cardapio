package com.cardapio.dto.pagamento;

import com.cardapio.entity.TipoFormaPagamento;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/** Cadastro/edição de forma de pagamento. Taxas e mínimo são opcionais (vazio = zero / sem mínimo). */
public record FormaPagamentoRequest(
        @NotBlank @Size(max = 100) String nome,
        @NotNull TipoFormaPagamento tipo,
        @PositiveOrZero @DecimalMax("100") BigDecimal taxaPercentual,
        @PositiveOrZero BigDecimal taxaFixa,
        @PositiveOrZero BigDecimal valorMinimo,
        Boolean aceitaEntrega,
        Boolean aceitaRetirada,
        Integer ordem,
        Boolean ativo
) {
}
