package com.cardapio.dto.pedido;

import com.cardapio.entity.ItemPedido;

import java.math.BigDecimal;

public record ItemPedidoResponse(
        Long id,
        Long produtoId,
        String nomeProduto,
        BigDecimal precoUnitario,
        Integer quantidade,
        BigDecimal totalItem,
        String observacoes
) {
    public static ItemPedidoResponse of(ItemPedido i) {
        return new ItemPedidoResponse(
                i.getId(), i.getProduto().getId(), i.getNomeProduto(), i.getPrecoUnitario(),
                i.getQuantidade(), i.getTotalItem(), i.getObservacoes());
    }
}
