package com.cardapio.dto.pedido;

import com.cardapio.entity.StatusPedido;
import com.cardapio.entity.TipoEntrega;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** O que o cliente vê ao acompanhar o pedido (sem telefone, endereço completo nem dados internos). */
public record AcompanhamentoResponse(
        Long numero,
        String loja,
        String slug,
        String logoUrl,
        String lojaTelefone,
        TipoEntrega tipoEntrega,
        String cliente,
        String situacao,
        String cor,
        StatusPedido categoria,
        boolean cancelado,
        boolean concluido,
        List<Etapa> etapas,
        LocalDateTime criadoEm,
        LocalDateTime previsaoPreparo,
        List<Item> itens,
        BigDecimal subtotal,
        BigDecimal taxaEntrega,
        BigDecimal total,
        String destino,
        Entregador entregador,
        Double destinoLatitude,
        Double destinoLongitude,
        List<Ponto> trilha,
        String codigoEntrega,
        com.cardapio.service.AvaliacaoService.AvaliacaoCliente avaliacao,
        boolean podeAvaliar,
        boolean avaliaEntrega
) {

    /** Uma etapa da linha do tempo; concluida vale para as já passadas e atual para a situação de agora. */
    public record Etapa(String nome, String cor, boolean concluida, boolean atual) {
    }

    public record Item(String nome, int quantidade, BigDecimal total) {
    }

    public record Ponto(double latitude, double longitude) {
    }

    /** Aparece só enquanto o pedido está com o entregador; posição é a última enviada pelo celular dele. */
    public record Entregador(String nome, String veiculo, Double latitude, Double longitude, LocalDateTime posicaoEm) {
    }
}
