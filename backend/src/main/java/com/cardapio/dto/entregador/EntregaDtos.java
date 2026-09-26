package com.cardapio.dto.entregador;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** Visão de entregas: em rota agora e repasse por período. */
public final class EntregaDtos {

    private EntregaDtos() {
    }

    public record PedidoEmRota(Long id, String cliente, String bairro, String situacao, String cor, LocalDateTime dataCriacao) {
    }

    public record EntregadorEmRota(Long id, String nome, String tipo, Double latitude, Double longitude, LocalDateTime posicaoEm,
                                   List<PedidoEmRota> pedidos) {
    }

    public record EntregasEmRota(List<EntregadorEmRota> entregadores, List<PedidoEmRota> semEntregador) {
    }

    public record LinhaRepasse(Long entregadorId, String entregador, String tipo, long entregas, BigDecimal repasse) {
    }

    public record Repasse(List<LinhaRepasse> linhas, long totalEntregas, BigDecimal totalRepasse) {
    }
}
