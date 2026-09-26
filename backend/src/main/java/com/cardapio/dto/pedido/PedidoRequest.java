package com.cardapio.dto.pedido;

import com.cardapio.entity.TipoEntrega;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record PedidoRequest(
        @NotNull UUID tenant,
        @NotBlank String nomeCliente,
        @NotBlank String telefoneCliente,
        @NotNull TipoEntrega tipoEntrega,
        String enderecoRua,
        String enderecoNumero,
        String enderecoComplemento,
        String enderecoBairro,
        String enderecoCidade,
        Double latitude,
        Double longitude,
        @NotEmpty @Valid List<ItemPedidoRequest> itens,
        String formaPagamento,
        String observacoes,
        String descontoTipo,
        java.math.BigDecimal descontoValor,
        java.math.BigDecimal taxaEntrega,
        java.util.List<PagamentoRequest> pagamentos
) {
}
