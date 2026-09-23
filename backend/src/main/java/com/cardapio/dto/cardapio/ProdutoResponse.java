package com.cardapio.dto.cardapio;

import com.cardapio.entity.Produto;

import java.math.BigDecimal;

public record ProdutoResponse(
        Long id,
        Long categoriaId,
        String categoriaNome,
        String nome,
        String descricao,
        BigDecimal preco,
        String imagemUrl,
        boolean disponivel,
        Integer ordemExibicao
) {
    public static ProdutoResponse of(Produto p) {
        return new ProdutoResponse(
                p.getId(), p.getCategoria().getId(), p.getCategoria().getNome(), p.getNome(),
                p.getDescricao(), p.getPreco(), p.getImagemUrl(), p.isDisponivel(), p.getOrdemExibicao());
    }
}
