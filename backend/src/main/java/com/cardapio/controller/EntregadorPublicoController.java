package com.cardapio.controller;

import com.cardapio.dto.entregador.EntregadorPublicoDtos.PainelEntregador;
import com.cardapio.dto.entregador.EntregadorPublicoDtos.PosicaoRequest;
import com.cardapio.service.EntregadorPublicoService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** Página do entregador (celular): o acesso é o token secreto no endereço, sem login. */
@RestController
@RequestMapping("/api/publico/entregador/{token}")
@RequiredArgsConstructor
public class EntregadorPublicoController {

    private final EntregadorPublicoService service;

    /** Manifesto do PWA (instalar na tela inicial do celular). */
    @GetMapping(path = "/manifest.webmanifest", produces = "application/manifest+json")
    public java.util.Map<String, Object> manifesto(@PathVariable UUID token) {
        return service.manifesto(token);
    }

    @GetMapping
    public PainelEntregador painel(@PathVariable UUID token) {
        return service.painel(token);
    }

    @PostMapping("/pedidos/{pedidoId}/saiu")
    public ResponseEntity<Void> sair(@PathVariable UUID token, @PathVariable Long pedidoId) {
        service.sair(token, pedidoId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(path = "/pedidos/{pedidoId}/entregue")
    public ResponseEntity<Void> entregar(@PathVariable UUID token, @PathVariable Long pedidoId,
                                         @RequestPart(name = "foto", required = false) MultipartFile foto,
                                         @RequestParam(name = "codigo", required = false) String codigo) {
        service.entregar(token, pedidoId, foto, codigo);
        return ResponseEntity.noContent().build();
    }

    /** O entregador aceitou notificações neste aparelho: recebe aviso de nova entrega. */
    @PostMapping("/push")
    public ResponseEntity<Void> assinarPush(@PathVariable UUID token, @RequestBody com.cardapio.service.PushService.Assinatura assinatura) {
        service.assinarPush(token, assinatura);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/posicao")
    public ResponseEntity<Void> posicao(@PathVariable UUID token, @RequestBody PosicaoRequest request) {
        service.posicao(token, request.latitude(), request.longitude());
        return ResponseEntity.noContent().build();
    }
}
