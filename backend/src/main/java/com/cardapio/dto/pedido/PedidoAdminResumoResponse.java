package com.cardapio.dto.pedido;

import com.cardapio.entity.StatusPedido;
import com.cardapio.entity.T_Pedido;
import com.cardapio.entity.TipoEntrega;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Pedido na tela de busca. quantidadeItens é a soma das quantidades dos itens. */
public record PedidoAdminResumoResponse(
        Long id,
        String nomeCliente,
        String telefoneCliente,
        TipoEntrega tipoEntrega,
        String bairro,
        long quantidadeItens,
        BigDecimal total,
        StatusPedido status,
        LocalDateTime dataCriacao,
        boolean editado,
        Long situacaoId,
        String situacaoNome,
        String situacaoCor
) {

    public static PedidoAdminResumoResponse of(T_Pedido p, long quantidadeItens, FluxoDtos.SituacaoInfo situacao) {
        return new PedidoAdminResumoResponse(
                p.getId(), p.getNomeCliente(), p.getTelefoneCliente(), p.getTipoEntrega(), p.getEnderecoBairro(),
                quantidadeItens, p.getTotal(), p.getStatus(), p.getDataCriacao(), p.isEditado(),
                situacao != null ? situacao.id() : null, situacao != null ? situacao.nome() : null,
                situacao != null ? situacao.cor() : null);
    }
}
