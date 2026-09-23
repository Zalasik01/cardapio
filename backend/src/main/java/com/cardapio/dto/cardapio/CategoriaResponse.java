package com.cardapio.dto.cardapio;

import com.cardapio.entity.Categoria;

public record CategoriaResponse(
        Long id,
        String nome,
        Integer ordemExibicao,
        boolean ativo
) {
    public static CategoriaResponse of(Categoria c) {
        return new CategoriaResponse(c.getId(), c.getNome(), c.getOrdemExibicao(), c.isAtivo());
    }
}
