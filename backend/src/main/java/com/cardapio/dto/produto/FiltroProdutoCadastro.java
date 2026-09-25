package com.cardapio.dto.produto;

import com.cardapio.entity.TipoProduto;

/** Filtros da tela de busca de produtos (o tipo é sempre informado: cada tela lista um tipo). */
public record FiltroProdutoCadastro(
        TipoProduto tipo,
        String busca,
        Long categoriaId,
        boolean mostrarInativos
) {
}
