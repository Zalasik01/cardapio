package com.cardapio.dto.pedido;

import com.cardapio.entity.StatusPedido;
import com.cardapio.entity.TipoEntrega;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

/** Pedidos e respostas do fluxo de pedidos (situações do kanban e transições entre elas). */
public final class FluxoDtos {

    private FluxoDtos() {
    }

    /** Situação (coluna) no editor. chave liga as transições a situações novas, que ainda não têm id. */
    public record SituacaoRequest(
            @NotBlank String chave,
            @NotBlank @Size(max = 60) String nome,
            @NotBlank @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "cor inválida") String cor,
            @NotNull StatusPedido categoria,
            boolean ativa
    ) {
    }

    public record TransicaoRequest(
            @NotBlank String de,
            @NotBlank String para,
            TipoEntrega tipoPedido,
            @Size(max = 60) String rotulo
    ) {
    }

    /** Fluxo completo: a ordem da lista de situações é a ordem das colunas. */
    public record FluxoRequest(
            @NotEmpty @Valid List<SituacaoRequest> situacoes,
            @Valid List<TransicaoRequest> transicoes
    ) {
    }

    public record SituacaoResponse(
            Long id,
            String nome,
            String cor,
            StatusPedido categoria,
            int ordem,
            boolean ativa,
            /** Situação de cancelamento: fixa (não pode ser removida nem mudar de categoria). */
            boolean fixa,
            /** Pedidos ainda em andamento nesta situação (impede remover). */
            long pedidosAbertos
    ) {
    }

    public record TransicaoResponse(Long de, Long para, TipoEntrega tipoPedido, String rotulo) {
    }

    public record FluxoResponse(List<SituacaoResponse> situacoes, List<TransicaoResponse> transicoes) {
    }

    /** Situação atual do pedido. */
    public record SituacaoInfo(Long id, String nome, String cor, StatusPedido categoria) {
    }

    /** Para onde o pedido pode ir agora e o texto do botão. */
    public record ProximaSituacao(Long id, String nome, String cor, StatusPedido categoria, String rotulo) {
    }
}
