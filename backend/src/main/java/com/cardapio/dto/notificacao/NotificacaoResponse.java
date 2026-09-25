package com.cardapio.dto.notificacao;

import com.cardapio.entity.T_Notificacao;
import java.time.LocalDateTime;

public record NotificacaoResponse(
        Long id,
        String tipo,
        String titulo,
        String mensagem,
        String rota,
        Long pedidoId,
        LocalDateTime dataCriacao
) {

    public static NotificacaoResponse of(T_Notificacao n) {
        return new NotificacaoResponse(n.getId(), n.getTipo().name(), n.getTitulo(), n.getMensagem(), n.getRota(),
                n.getIdPedido(), n.getDataCriacao());
    }
}
