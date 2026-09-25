package com.cardapio.dto.pagamento;

import com.cardapio.entity.T_FormaPagamento;
import com.cardapio.entity.TipoFormaPagamento;
import java.math.BigDecimal;

public record FormaPagamentoResponse(
        Long id,
        String nome,
        TipoFormaPagamento tipo,
        BigDecimal taxaPercentual,
        BigDecimal taxaFixa,
        BigDecimal valorMinimo,
        boolean aceitaEntrega,
        boolean aceitaRetirada,
        Integer ordem,
        boolean ativo
) {

    public static FormaPagamentoResponse of(T_FormaPagamento f) {
        return new FormaPagamentoResponse(f.getId(), f.getNome(), f.getTipo(), f.getTaxaPercentual(), f.getTaxaFixa(),
                f.getValorMinimo(), f.isAceitaEntrega(), f.isAceitaRetirada(), f.getOrdem(), f.isAtivo());
    }
}
