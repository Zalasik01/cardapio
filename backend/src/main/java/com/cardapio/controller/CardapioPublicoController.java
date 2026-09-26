package com.cardapio.controller;

import com.cardapio.dto.cardapio.CardapioResponse;
import com.cardapio.service.CardapioService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/publico")
@RequiredArgsConstructor
public class CardapioPublicoController {

    private final CardapioService cardapioService;

    /** Manifesto do PWA do cardápio: instalar a loja na tela inicial do celular (abre direto no cardápio dela). */
    @GetMapping(path = "/lojas/{slug}/manifest.webmanifest", produces = "application/manifest+json")
    public java.util.Map<String, Object> manifesto(@PathVariable String slug) {
        return cardapioService.manifesto(slug);
    }

    @GetMapping("/lojas/{slug}/cardapio")
    public CardapioResponse buscarCardapio(@PathVariable String slug) {
        return cardapioService.buscarCardapioPublico(slug);
    }
}
