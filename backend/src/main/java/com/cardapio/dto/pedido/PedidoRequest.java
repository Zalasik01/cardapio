package com.cardapio.dto.pedido;

import com.cardapio.entity.TipoEntrega;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record PedidoRequest(
        @NotNull Long restauranteId,
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
        String observacoes
) {
}
