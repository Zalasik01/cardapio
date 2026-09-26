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

    @GetMapping
    public AcompanhamentoResponse obter(@PathVariable UUID guid) {
        return service.obter(guid);
    }

    /** Aviso em tempo real: chega "atualizado" sempre que a situação, o entregador ou a posição mudam. */
    @GetMapping(path = "/eventos", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter eventos(@PathVariable UUID guid) {
        return service.eventos(guid);
    }
}
