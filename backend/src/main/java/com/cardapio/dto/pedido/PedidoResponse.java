package com.cardapio.dto.pedido;

import com.cardapio.entity.T_Pedido;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PedidoResponse(
        UUID guid,
        UUID tenant,
        String nomeCliente,
        String telefoneCliente,
        String tipoEntrega,
        String enderecoRua,
        String enderecoNumero,
        String enderecoComplemento,
        String enderecoBairro,
        String enderecoCidade,
        List<ItemPedidoResponse> itens,
        BigDecimal subtotal,
        BigDecimal taxaEntrega,
        BigDecimal total,
        String formaPagamento,
        String observacoes,
        String status,
        Instant dataCriacao
) {
    public static PedidoResponse of(T_Pedido p) {
        return new PedidoResponse(
                p.getGuid(), p.getTenant(), p.getNomeCliente(), p.getTelefoneCliente(),
                p.getTipoEntrega().name(), p.getEnderecoRua(), p.getEnderecoNumero(), p.getEnderecoComplemento(),
                p.getEnderecoBairro(), p.getEnderecoCidade(),
                p.getItens().stream().map(ItemPedidoResponse::of).toList(),
                p.getSubtotal(), p.getTaxaEntrega(), p.getTotal(), p.getFormaPagamento(),
                p.getObservacoes(), p.getStatus().name(), p.getDataCriacao());
    }
}
