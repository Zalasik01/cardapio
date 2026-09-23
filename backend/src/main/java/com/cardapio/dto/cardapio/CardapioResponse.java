package com.cardapio.dto.cardapio;

import com.cardapio.dto.loja.LojaResponse;

import java.util.List;
import java.util.UUID;

public record CardapioResponse(
        LojaResponse loja,
        List<CategoriaComProdutosResponse> categorias
) {
    public record CategoriaComProdutosResponse(
            UUID guid,
            String nome,
            List<ProdutoResponse> produtos
    ) {
    }
}
