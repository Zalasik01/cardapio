package com.cardapio.dto.gestao;

import com.cardapio.entity.SituacaoMensalidade;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Lançamento de mensalidade. A competência pode vir com qualquer dia do mês: vale o primeiro dia. */
public record MensalidadeRequest(
        @NotNull LocalDate competencia,
        @NotNull @PositiveOrZero BigDecimal valor,
        @NotNull LocalDate dataVencimento,
        LocalDate dataPagamento,
        @NotNull SituacaoMensalidade situacao,
        @Size(max = 2000) String observacao
) {
}
