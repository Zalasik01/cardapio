package com.cardapio.controller;

import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Chave pública do Web Push (o navegador precisa dela para pedir a assinatura). */
@RestController
@RequestMapping("/api/publico/push")
@RequiredArgsConstructor
public class PushPublicoController {

    private final com.cardapio.service.PushService pushService;

    @GetMapping("/chave")
    public Map<String, String> chave() {
        return Map.of("chave", pushService.chavePublica());
    }
}
