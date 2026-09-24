package com.cardapio.dto.gestao;

import com.cardapio.entity.S_LojaMensalidade;
import com.cardapio.entity.SituacaoMensalidade;

import java.math.BigDecimal;
import java.time.LocalDate;

/** atrasada = pendente com o vencimento já passado (calculada na consulta, não gravada). */
public record MensalidadeResponse(
        Long id,
        LocalDate competencia,
        BigDecimal valor,
        LocalDate dataVencimento,
        LocalDate dataPagamento,
        SituacaoMensalidade situacao,
        boolean atrasada,
        String observacao
) {

    public static MensalidadeResponse of(S_LojaMensalidade m) {
        boolean atrasada = m.getSituacao() == SituacaoMensalidade.PENDENTE && m.getDataVencimento().isBefore(LocalDate.now());
        return new MensalidadeResponse(
                m.getId(), m.getCompetencia(), m.getValor(), m.getDataVencimento(), m.getDataPagamento(),
                m.getSituacao(), atrasada, m.getObservacao());
    }
}
