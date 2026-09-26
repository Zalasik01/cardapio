package com.cardapio.dto.categoria;

import com.cardapio.entity.T_Categoria;

/** Categoria na busca e no cadastro. quantidadeProdutos conta os produtos (não excluídos) vinculados a ela. */
public record CategoriaCadastroResponse(
        Long id,
        String nome,
        Integer ordemExibicao,
        boolean ativo,
        long quantidadeProdutos,
        Integer tempoPreparoMinutos
) {

    public static CategoriaCadastroResponse of(T_Categoria c, long quantidadeProdutos) {
        return new CategoriaCadastroResponse(c.getId(), c.getNome(), c.getOrdemExibicao(), c.isAtivo(), quantidadeProdutos, c.getTempoPreparoMinutos());
    }
}
