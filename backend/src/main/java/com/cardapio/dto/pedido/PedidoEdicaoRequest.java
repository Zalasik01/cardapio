package com.cardapio.dto.pedido;

import com.cardapio.entity.TipoEntrega;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

/** Novos dados do pedido na edição. Os itens são a lista final (o que não estiver nela é removido). */
public record PedidoEdicaoRequest(
        @NotBlank String nomeCliente,
        @NotBlank String telefoneCliente,
        @NotNull TipoEntrega tipoEntrega,
        String enderecoRua,
        String enderecoNumero,
        String enderecoComplemento,
        String enderecoBairro,
        String enderecoCidade,
        @NotEmpty @Valid List<ItemPedidoRequest> itens,
        String formaPagamento,
        String observacoes,
        String descontoTipo,
        BigDecimal descontoValor,
        BigDecimal taxaEntrega,
        List<PagamentoRequest> pagamentos
) {
}
