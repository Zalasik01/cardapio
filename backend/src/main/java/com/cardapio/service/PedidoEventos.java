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

    /** Clientes acompanhando um pedido (página pública de rastreamento), por id do pedido. */
    private final Map<Long, List<SseEmitter>> acompanhamentos = new ConcurrentHashMap<>();
    private static final long DURACAO_ACOMPANHAMENTO_MS = 30L * 60 * 1000;

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

    /** Abre a conexão de um cliente que acompanha o pedido; recebe "atualizado" quando algo muda (situação, entregador, posição). */
    public SseEmitter inscreverAcompanhamento(Long pedidoId) {
        SseEmitter emissor = new SseEmitter(DURACAO_ACOMPANHAMENTO_MS);
        List<SseEmitter> lista = acompanhamentos.computeIfAbsent(pedidoId, chave -> new CopyOnWriteArrayList<>());
        lista.add(emissor);
        Runnable remover = () -> {
            lista.remove(emissor);
            if (lista.isEmpty()) {
                acompanhamentos.remove(pedidoId, lista);
            }
        };
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
        // o painel só recebe mudanças de situação/novos pedidos; a posição do entregador é só do cliente que acompanha
        if (!"POSICAO".equals(evento.tipo())) {
            enviar(evento.tenant(), SseEmitter.event().name("pedido").data(evento));
        }
        for (SseEmitter emissor : acompanhamentos.getOrDefault(evento.pedidoId(), List.of())) {
            try {
                emissor.send(SseEmitter.event().name("atualizado").data(evento.tipo()));
            } catch (IOException | IllegalStateException e) {
                emissor.completeWithError(e);
            }
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void aoCriarNotificacao(NotificacaoService.NotificacaoCriada evento) {
        enviar(evento.tenant(), SseEmitter.event().name("notificacao").data(evento.notificacao()));
    }

    /** Mantém a conexão viva (proxies fecham conexões paradas). */
    @Scheduled(fixedRate = 20_000)
    public void batimento() {
        conexoes.keySet().forEach(tenant -> enviar(tenant, SseEmitter.event().comment("batimento")));
        acompanhamentos.values().forEach(lista -> lista.forEach(emissor -> {
            try {
                emissor.send(SseEmitter.event().comment("batimento"));
            } catch (IOException | IllegalStateException e) {
                emissor.completeWithError(e);
            }
        }));
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
