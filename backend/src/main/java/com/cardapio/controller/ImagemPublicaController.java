package com.cardapio.controller;

import com.cardapio.service.ImagemService;
import com.cardapio.storage.ArmazenamentoImagens;
import java.time.Duration;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Entrega as imagens enviadas (o cardápio público mostra logo e fotos dos produtos). O nome é um UUID: cache longo. */
@RestController
@RequestMapping("/api/publico/imagens")
@RequiredArgsConstructor
public class ImagemPublicaController {

    private static final Pattern PASTA = Pattern.compile("^[a-zA-Z0-9-]{1,64}$");
    private static final Pattern ARQUIVO = Pattern.compile("^[a-f0-9-]{36}\\.(png|jpg|webp)$");

    private final ArmazenamentoImagens armazenamento;
    private final ImagemService imagemService;

    @GetMapping("/{pasta}/{arquivo}")
    public ResponseEntity<byte[]> obter(@PathVariable String pasta, @PathVariable String arquivo) {
        if (!PASTA.matcher(pasta).matches() || !ARQUIVO.matcher(arquivo).matches()) {
            return ResponseEntity.notFound().build();
        }
        return armazenamento.ler(pasta, arquivo)
                .map(conteudo -> ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(imagemService.tipoDe(arquivo)))
                        .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                        .header("X-Content-Type-Options", "nosniff")
                        .body(conteudo))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
