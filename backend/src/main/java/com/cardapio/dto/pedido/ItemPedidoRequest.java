package com.cardapio.dto.pedido;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record ItemPedidoRequest(
        @NotNull UUID produtoGuid,
        @NotNull @Positive Integer quantidade,
        String observacoes,
        java.util.List<Long> opcoes
) {

    /** Sem adicionais/variações. */
    public ItemPedidoRequest(UUID produtoGuid, Integer quantidade, String observacoes) {
        this(produtoGuid, quantidade, observacoes, null);
    }

    /** Chave que separa linhas do mesmo produto com opções diferentes. */
    public String chave() {
        return produtoGuid + "|" + (opcoes == null ? "" : opcoes.stream().sorted().map(String::valueOf).collect(java.util.stream.Collectors.joining(",")));
    }
}
