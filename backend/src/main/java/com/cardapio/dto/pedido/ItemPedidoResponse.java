package com.cardapio.dto.pedido;

import com.cardapio.entity.I_ItemPedido;

import java.math.BigDecimal;
import java.util.UUID;

public record ItemPedidoResponse(
        UUID guid,
        UUID produtoGuid,
        String nomeProduto,
        BigDecimal precoUnitario,
        Integer quantidade,
        BigDecimal totalItem,
        String observacoes,
        java.util.List<OpcaoEscolhida> opcoes
) {

    public record OpcaoEscolhida(String grupo, String nome, BigDecimal preco) {
    }

    public static ItemPedidoResponse of(I_ItemPedido i) {
        return new ItemPedidoResponse(
                i.getGuid(), i.getProduto().getGuid(), i.getNomeProduto(), i.getPrecoUnitario(),
                i.getQuantidade(), i.getTotalItem(), i.getObservacoes(),
                i.getOpcoes().stream().map(o -> new OpcaoEscolhida(o.getNomeGrupo(), o.getNomeOpcao(), o.getPreco())).toList());
    }
}
