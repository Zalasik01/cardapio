package com.cardapio.dto.pessoa;

import com.cardapio.entity.TipoPessoa;

/** Filtros da tela de busca de clientes e fornecedores. Campos nulos ou vazios nao filtram. */
public record FiltroPessoa(
        String busca,
        String nome,
        String documento,
        TipoPessoa tipo,
        String papel,
        boolean mostrarInativos
) {
}
