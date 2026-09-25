package com.cardapio.dto.produto;

import com.cardapio.entity.T_Produto;
import com.cardapio.entity.TipoProduto;
import com.cardapio.entity.UnidadeMedida;

import java.math.BigDecimal;

/** Produto na tela de busca. */
public record ProdutoCadastroResumoResponse(
        Long id,
        TipoProduto tipo,
        String codigo,
        String nome,
        String categoriaNome,
        UnidadeMedida unidadeMedida,
        BigDecimal preco,
        BigDecimal custoUnitario,
        String fornecedorNome,
        boolean disponivel,
        boolean ativo
) {

    public static ProdutoCadastroResumoResponse of(T_Produto p, String fornecedorNome) {
        return new ProdutoCadastroResumoResponse(
                p.getId(), p.getTipo(), p.getCodigo(), p.getNome(),
                p.getCategoria() == null ? null : p.getCategoria().getNome(),
                p.getUnidadeMedida(), p.getPreco(), p.getCustoUnitario(), fornecedorNome, p.isDisponivel(), p.isAtivo());
    }
}
