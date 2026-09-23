package com.cardapio.dto.cardapio;

import com.cardapio.entity.T_Categoria;

import java.util.UUID;

public record CategoriaResponse(
        UUID guid,
        String nome,
        Integer ordemExibicao,
        boolean ativo
) {
    public static CategoriaResponse of(T_Categoria c) {
        return new CategoriaResponse(c.getGuid(), c.getNome(), c.getOrdemExibicao(), c.isAtivo());
    }
}
