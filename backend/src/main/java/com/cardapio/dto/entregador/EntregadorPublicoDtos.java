package com.cardapio.dto.entregador;

import com.cardapio.dto.pedido.PedidoAdminResponse;
import java.math.BigDecimal;
import java.util.List;

/** Respostas da página do entregador (celular, sem login: o acesso é o link secreto). */
public final class EntregadorPublicoDtos {

    private EntregadorPublicoDtos() {
    }

    public record ItemEntrega(String nome, int quantidade, String observacoes) {
    }

    /** Uma entrega do entregador: para onde ir, o que levar, o que receber e o que ele pode fazer agora. */
    public record EntregaCelular(
            Long id,
            String cliente,
            String telefone,
            String endereco,
            String bairro,
            String destinoMapa,
            String observacoes,
            List<ItemEntrega> itens,
            BigDecimal total,
            List<PedidoAdminResponse.Pagamento> pagamentos,
            String formaPagamento,
            String situacao,
            String cor,
            boolean podeSair,
            boolean podeEntregar,
            boolean exigeCodigo,
            java.time.LocalDateTime criadoEm
    ) {
    }

    public record PainelEntregador(String nome, String loja, List<EntregaCelular> entregas, long entreguesHoje, BigDecimal repasseHoje) {
    }

    public record PosicaoRequest(Double latitude, Double longitude) {
    }
}
