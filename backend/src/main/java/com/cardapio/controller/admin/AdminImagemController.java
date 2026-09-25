package com.cardapio.controller.admin;

import com.cardapio.service.ImagemService;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** Envio de imagens pelo painel: logo da loja e fotos de produtos (da loja) e logo de qualquer loja (gestão interna). */
@RestController
@RequiredArgsConstructor
public class AdminImagemController {

    private final ImagemService imagemService;

    @PreAuthorize("@perm.tem('MINHA_LOJA_ALTERAR', 'PRODUTOS_FINAIS_INCLUIR', 'PRODUTOS_FINAIS_ALTERAR')")
    @PostMapping(path = "/api/admin/lojas/{tenant}/imagens", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> enviar(@PathVariable UUID tenant, @RequestParam("arquivo") MultipartFile arquivo) {
        return ResponseEntity.ok(Map.of("url", imagemService.enviar(tenant.toString(), arquivo)));
    }

    /** Gestão interna (administrador da plataforma) envia a logo de uma loja qualquer. */
    @PostMapping(path = "/api/admin/gestao/imagens", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> enviarGestao(@RequestParam("arquivo") MultipartFile arquivo) {
        return ResponseEntity.ok(Map.of("url", imagemService.enviar("gestao", arquivo)));
    }
}
