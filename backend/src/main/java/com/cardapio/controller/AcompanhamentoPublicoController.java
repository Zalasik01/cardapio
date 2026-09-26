package com.cardapio.controller;

import com.cardapio.dto.pedido.AcompanhamentoResponse;
import com.cardapio.service.AcompanhamentoService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/** Página pública de acompanhamento do pedido (o guid é o segredo do link). */
@RestController
@RequestMapping("/api/publico/acompanhamento/{guid}")
@RequiredArgsConstructor
public class AcompanhamentoPublicoController {

    private final AcompanhamentoService service;
    private final com.cardapio.service.PushService pushService;
    private final com.cardapio.service.AvaliacaoService avaliacaoService;

    @GetMapping
    public AcompanhamentoResponse obter(@PathVariable UUID guid) {
        return service.obter(guid);
    }

    /** O cliente avalia o pedido entregue (sem login: o guid do pedido é o segredo). */
    @org.springframework.web.bind.annotation.PostMapping("/avaliacao")
    public com.cardapio.service.AvaliacaoService.AvaliacaoCliente avaliar(@PathVariable UUID guid,
            @org.springframework.web.bind.annotation.RequestBody com.cardapio.service.AvaliacaoService.AvaliacaoRequest request) {
        return avaliacaoService.avaliar(guid, request);
    }

    /** O cliente aceitou notificações deste pedido: recebe um aviso a cada mudança de situação. */
    @org.springframework.web.bind.annotation.PostMapping("/push")
    public org.springframework.http.ResponseEntity<Void> assinar(@PathVariable UUID guid, @org.springframework.web.bind.annotation.RequestBody com.cardapio.service.PushService.Assinatura assinatura) {
        service.assinarPush(guid, assinatura, pushService);
        return org.springframework.http.ResponseEntity.noContent().build();
    }

    /** Aviso em tempo real: chega "atualizado" sempre que a situação, o entregador ou a posição mudam. */
    @GetMapping(path = "/eventos", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter eventos(@PathVariable UUID guid, jakarta.servlet.http.HttpServletResponse resposta) {
        // sem isto, proxies e túneis seguram a resposta e o cliente só recebe os eventos em lote
        resposta.setHeader("Cache-Control", "no-cache, no-transform");
        resposta.setHeader("X-Accel-Buffering", "no");
        return service.eventos(guid);
    }
}
