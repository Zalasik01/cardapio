package com.cardapio.dto.pedido;

import com.cardapio.entity.I_ItemPedido;
import com.cardapio.entity.StatusPedido;
import com.cardapio.entity.T_Pedido;
import com.cardapio.entity.TipoEntrega;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** Pedido completo para o painel. proximasSituacoes são as únicas situações para as quais ele pode ir agora (dadas pelo fluxo da loja). */
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
        BigDecimal desconto,
        BigDecimal total,
        String formaPagamento,
        String observacoes,
        StatusPedido status,
        FluxoDtos.SituacaoInfo situacao,
        List<FluxoDtos.ProximaSituacao> proximasSituacoes,
        LocalDateTime dataCriacao,
        LocalDateTime dataAtualizacao,
        long totalPedidosCliente,
        String motivoCancelamento,
        BigDecimal taxaCancelamento,
        String descontoTipo,
        BigDecimal descontoValor,
        boolean editado,
        LocalDateTime dataEdicao,
        List<Alteracao> alteracoes,
        BigDecimal taxaPagamentos,
        Integer tempoPreparoMinutos,
        List<Pagamento> pagamentos,
        EntregadorInfo entregador,
        BigDecimal repasseEntregador,
        String fotoEntregaUrl,
        LocalDateTime dataEntrega,
        java.util.UUID guid
) {

    public record Item(java.util.UUID produtoGuid, String nomeProduto, BigDecimal precoUnitario, Integer quantidade, BigDecimal totalItem, String observacoes) {
        static Item of(I_ItemPedido i) {
            return new Item(i.getProduto() != null ? i.getProduto().getGuid() : null, i.getNomeProduto(), i.getPrecoUnitario(), i.getQuantidade(), i.getTotalItem(), i.getObservacoes());
        }
    }

    /** Entregador responsável pelo pedido. */
    public record EntregadorInfo(Long id, String nome) {
    }

    /** Uma parte do pagamento: a forma, o valor, a taxa e, no dinheiro, o valor recebido e o troco. */
    public record Pagamento(Long formaId, String forma, com.cardapio.entity.TipoFormaPagamento tipo, BigDecimal valor, BigDecimal taxa,
                            BigDecimal valorRecebido, BigDecimal troco) {
    }

    /** Uma edição do pedido: quando, quem e o que mudou. */
    public record Alteracao(LocalDateTime data, String usuario, List<String> descricoes) {
        public static Alteracao of(com.cardapio.entity.T_PedidoAlteracao a) {
            return new Alteracao(a.getDataCriacao(), a.getUsuarioNome(), List.of(a.getDescricoes().split("\n")));
        }
    }

    /** totalPedidosCliente: quantos pedidos (não cancelados) esse telefone já fez na loja, contando este. */
    public static PedidoAdminResponse of(T_Pedido p, FluxoDtos.SituacaoInfo situacao,
                                         List<FluxoDtos.ProximaSituacao> proximas, long totalPedidosCliente,
                                         List<Alteracao> alteracoes, List<Pagamento> pagamentos,
                                         EntregadorInfo entregador) {
        return new PedidoAdminResponse(
                p.getId(), p.getNomeCliente(), p.getTelefoneCliente(), p.getTipoEntrega(), p.getEnderecoRua(),
                p.getEnderecoNumero(), p.getEnderecoComplemento(), p.getEnderecoBairro(), p.getEnderecoCidade(),
                p.getItens().stream().map(Item::of).toList(), p.getSubtotal(), p.getTaxaEntrega(), p.getDesconto(), p.getTotal(),
                p.getFormaPagamento(), p.getObservacoes(), p.getStatus(), situacao, proximas,
                p.getDataCriacao(), p.getDataAtualizacao(), totalPedidosCliente,
                p.getMotivoCancelamento(), p.getTaxaCancelamento(), p.getDescontoTipo(), p.getDescontoValor(),
                p.isEditado(), p.getDataEdicao(), alteracoes, p.getTaxaPagamentos(), p.getTempoPreparoMinutos(), pagamentos,
                entregador, p.getRepasseEntregador(), p.getFotoEntregaUrl(), p.getDataEntrega(), p.getGuid());
    }
}
