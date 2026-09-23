package com.cardapio.dto.pedido;

import com.cardapio.entity.Pedido;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record PedidoResponse(
        Long id,
        Long restauranteId,
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
        Instant criadoEm
) {
    public static PedidoResponse of(Pedido p) {
        return new PedidoResponse(
                p.getId(), p.getRestaurante().getId(), p.getNomeCliente(), p.getTelefoneCliente(),
                p.getTipoEntrega().name(), p.getEnderecoRua(), p.getEnderecoNumero(), p.getEnderecoComplemento(),
                p.getEnderecoBairro(), p.getEnderecoCidade(),
                p.getItens().stream().map(ItemPedidoResponse::of).toList(),
                p.getSubtotal(), p.getTaxaEntrega(), p.getTotal(), p.getFormaPagamento(),
                p.getObservacoes(), p.getStatus().name(), p.getCriadoEm());
    }
}
