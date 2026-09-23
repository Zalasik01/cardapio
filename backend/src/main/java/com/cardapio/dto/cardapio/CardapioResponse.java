package com.cardapio.dto.cardapio;

import com.cardapio.dto.restaurante.RestauranteResponse;

import java.util.List;

public record CardapioResponse(
        RestauranteResponse restaurante,
        List<CategoriaComProdutosResponse> categorias
) {
    public record CategoriaComProdutosResponse(
            Long id,
            String nome,
            List<ProdutoResponse> produtos
    ) {
    }
}
