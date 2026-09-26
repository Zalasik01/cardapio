package com.cardapio.dto.cardapio;

import com.cardapio.dto.loja.LojaResponse;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record CardapioResponse(
        LojaResponse loja,
        boolean aberta,
        LocalDateTime proximaMudanca,
        List<FormaPagamentoPublica> formasPagamento,
        List<CategoriaComProdutosResponse> categorias
) {
    public record CategoriaComProdutosResponse(
            UUID guid,
            String nome,
            List<ProdutoResponse> produtos
    ) {
    }

    /** Forma de pagamento que a loja aceita, como o cliente a vê no checkout. */
    public record FormaPagamentoPublica(
            String nome,
            String tipo,
            BigDecimal taxaPercentual,
            BigDecimal taxaFixa,
            boolean aceitaEntrega,
            boolean aceitaRetirada
    ) {
    }
}
