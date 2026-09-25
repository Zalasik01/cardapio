package com.cardapio.dto.pedido;

import com.cardapio.entity.I_ItemPedido;
import com.cardapio.entity.StatusPedido;
import com.cardapio.entity.T_Pedido;
import com.cardapio.entity.TipoEntrega;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** Pedido completo para o painel. proximosStatus são os únicos status para os quais ele pode ir agora. */
public record PedidoAdminResponse(
        Long id,
        String nomeCliente,
        String telefoneCliente,
        TipoEntrega tipoEntrega,
        String enderecoRua,
        String enderecoNumero,
        String enderecoComplemento,
        String enderecoBairro,
        String enderecoCidade,
        List<Item> itens,
        BigDecimal subtotal,
        BigDecimal taxaEntrega,
        BigDecimal total,
        String formaPagamento,
        String observacoes,
        StatusPedido status,
        List<StatusPedido> proximosStatus,
        LocalDateTime dataCriacao,
        LocalDateTime dataAtualizacao
) {

    public record Item(String nomeProduto, BigDecimal precoUnitario, Integer quantidade, BigDecimal totalItem, String observacoes) {
        static Item of(I_ItemPedido i) {
            return new Item(i.getNomeProduto(), i.getPrecoUnitario(), i.getQuantidade(), i.getTotalItem(), i.getObservacoes());
        }
    }

    public static PedidoAdminResponse of(T_Pedido p, List<StatusPedido> proximosStatus) {
        return new PedidoAdminResponse(
                p.getId(), p.getNomeCliente(), p.getTelefoneCliente(), p.getTipoEntrega(), p.getEnderecoRua(),
                p.getEnderecoNumero(), p.getEnderecoComplemento(), p.getEnderecoBairro(), p.getEnderecoCidade(),
                p.getItens().stream().map(Item::of).toList(), p.getSubtotal(), p.getTaxaEntrega(), p.getTotal(),
                p.getFormaPagamento(), p.getObservacoes(), p.getStatus(), proximosStatus,
                p.getDataCriacao(), p.getDataAtualizacao());
    }
}
