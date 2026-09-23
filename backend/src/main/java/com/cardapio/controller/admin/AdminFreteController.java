package com.cardapio.controller.admin;

import com.cardapio.dto.frete.ZonaEntregaRequest;
import com.cardapio.dto.frete.ZonaEntregaResponse;
import com.cardapio.service.FreteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/restaurantes/{restauranteId}/zonas-entrega")
@RequiredArgsConstructor
public class AdminFreteController {

    private final FreteService freteService;

    @GetMapping
    public List<ZonaEntregaResponse> listar(@PathVariable Long restauranteId) {
        return freteService.listarZonas(restauranteId).stream().map(ZonaEntregaResponse::of).toList();
    }

    @PostMapping
    public ResponseEntity<ZonaEntregaResponse> criar(@PathVariable Long restauranteId,
                                                       @Valid @RequestBody ZonaEntregaRequest request) {
        var zona = freteService.criarZona(restauranteId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ZonaEntregaResponse.of(zona));
    }

    @PutMapping("/{zonaId}")
    public ZonaEntregaResponse atualizar(@PathVariable Long restauranteId, @PathVariable Long zonaId,
                                          @Valid @RequestBody ZonaEntregaRequest request) {
        return ZonaEntregaResponse.of(freteService.atualizarZona(restauranteId, zonaId, request));
    }

    @DeleteMapping("/{zonaId}")
    public ResponseEntity<Void> excluir(@PathVariable Long restauranteId, @PathVariable Long zonaId) {
        freteService.excluirZona(restauranteId, zonaId);
        return ResponseEntity.noContent().build();
    }
}
