package com.cardapio.dto.gestao;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Números da Gestão Interna (visão da plataforma, não de uma loja). */
public record GestaoDashboardResponse(
        Lojas lojas,
        Mensalidades mensalidades,
        Usuarios usuarios,
        List<Vencimento> proximosVencimentos,
        List<Vencimento> atrasadas
) {

    /** Quantidade por categoria (situação da conta ou tipo de organização); chave é o nome do enum. */
    public record Quantidade(String chave, long quantidade) {
    }

    public record Lojas(
            long total,
            long ativas,
            long inativas,
            List<Quantidade> porSituacao,
            List<Quantidade> porTipo
    ) {
    }

    /**
     * competencia é o mês corrente. receitaRecorrente = soma da mensalidade padrão das lojas ativas com conta ATIVA;
     * previsto/recebido/pendente são os lançamentos da competência; atrasadas = pendentes já vencidas (de qualquer mês);
     * lojasSemLancamento = lojas ativas (conta ATIVA ou INADIMPLENTE) sem mensalidade lançada na competência.
     */
    public record Mensalidades(
            LocalDate competencia,
            BigDecimal receitaRecorrente,
            BigDecimal previsto,
            BigDecimal recebido,
            BigDecimal pendente,
            long quantidadeAtrasadas,
            BigDecimal valorAtrasadas,
            long lojasSemLancamento
    ) {
    }

    public record Usuarios(long internos, long administradores, long pendentes) {
    }

    public record Vencimento(
            Long lojaId,
            String lojaNome,
            LocalDate competencia,
            LocalDate dataVencimento,
            BigDecimal valor
    ) {
    }
}
