package com.cardapio.service;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Avisa o painel da loja, em tempo real (Server-Sent Events do Spring), quando um pedido chega ou muda de situação.
 * Os eventos só saem depois que a transação do pedido foi confirmada.
 */
@Component
public class PedidoEventos {

    /** Evento de pedido: tipo NOVO (chegou) ou STATUS (mudou de situação). */
    public record PedidoEvento(UUID tenant, String tipo, Long pedidoId) {
    }

    private static final long SEM_LIMITE = 0L;

    private final Map<UUID, List<SseEmitter>> conexoes = new ConcurrentHashMap<>();

    /** Abre a conexão de um painel da loja. O emissor é removido quando o navegador fecha ou dá erro. */
    public SseEmitter inscrever(UUID tenant) {
        SseEmitter emissor = new SseEmitter(SEM_LIMITE);
        List<SseEmitter> daLoja = conexoes.computeIfAbsent(tenant, chave -> new CopyOnWriteArrayList<>());
        daLoja.add(emissor);
        Runnable remover = () -> daLoja.remove(emissor);
        emissor.onCompletion(remover);
        emissor.onTimeout(remover);
        emissor.onError(erro -> remover.run());
        try {
            emissor.send(SseEmitter.event().name("conectado").data("ok"));
        } catch (IOException e) {
            remover.run();
        }
        return emissor;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void aoMudarPedido(PedidoEvento evento) {
        enviar(evento.tenant(), SseEmitter.event().name("pedido").data(evento));
    }

    /** Mantém a conexão viva (proxies fecham conexões paradas). */
    @Scheduled(fixedRate = 20_000)
    public void batimento() {
        conexoes.keySet().forEach(tenant -> enviar(tenant, SseEmitter.event().comment("batimento")));
    }

    private void enviar(UUID tenant, SseEmitter.SseEventBuilder evento) {
        for (SseEmitter emissor : conexoes.getOrDefault(tenant, List.of())) {
            try {
                emissor.send(evento);
            } catch (IOException | IllegalStateException e) {
                emissor.completeWithError(e);
            }
        }
    }
}
