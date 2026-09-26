package com.cardapio.controller.admin;

import com.cardapio.dto.PaginaResponse;
import com.cardapio.service.AvaliacaoService;
import com.cardapio.service.AvaliacaoService.AvaliacaoAdmin;
import com.cardapio.service.AvaliacaoService.Resumo;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** Avaliações dos pedidos da loja: consulta, resumo e resposta. O acesso ao tenant da URL é validado no SecurityConfig. */
@RestController
@RequestMapping("/api/admin/lojas/{tenant}/avaliacoes")
@RequiredArgsConstructor
public class AdminAvaliacaoController {

    private final AvaliacaoService service;

    public record RespostaRequest(String resposta) {
    }

    @PreAuthorize("@perm.tem('AVALIACOES_LEITURA')")
    @GetMapping
    public PaginaResponse<AvaliacaoAdmin> listar(@PathVariable UUID tenant, @RequestParam(required = false) Integer nota,
                                                 @RequestParam(defaultValue = "false") boolean semResposta,
                                                 @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return service.listar(tenant, nota, semResposta, page, size);
    }

    @PreAuthorize("@perm.tem('AVALIACOES_LEITURA')")
    @GetMapping("/resumo")
    public Resumo resumo(@PathVariable UUID tenant) {
        return service.resumo(tenant);
    }

    @PreAuthorize("@perm.tem('AVALIACOES_RESPONDER')")
    @PutMapping("/{id}/resposta")
    public ResponseEntity<Void> responder(@PathVariable UUID tenant, @PathVariable Long id, @RequestBody RespostaRequest request) {
        service.responder(tenant, id, request.resposta());
        return ResponseEntity.noContent().build();
    }
}
