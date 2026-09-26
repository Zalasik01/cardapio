package com.cardapio.dto.cardapio;

import com.cardapio.entity.T_Produto;

import java.math.BigDecimal;
import java.util.UUID;

public record ProdutoResponse(
        UUID guid,
        UUID categoriaGuid,
        String categoriaNome,
        String nome,
        String descricao,
        BigDecimal preco,
        BigDecimal precoOriginal,
        boolean destaque,
        String imagemUrl,
        boolean disponivel,
        Integer ordemExibicao
) {
    public static ProdutoResponse of(T_Produto p) {
        return new ProdutoResponse(
                p.getGuid(), p.getCategoria().getGuid(), p.getCategoria().getNome(), p.getNome(),
                p.getDescricao(), p.precoVenda(), p.emPromocao() ? p.getPreco() : null, p.isDestaque(), p.getImagemUrl(), p.isDisponivel(), p.getOrdemExibicao());
    }
}
