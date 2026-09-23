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
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/lojas/{tenant}/zonas-entrega")
@RequiredArgsConstructor
public class AdminFreteController {

    private final FreteService freteService;

    @GetMapping
    public List<ZonaEntregaResponse> listar(@PathVariable UUID tenant) {
        return freteService.listarZonas(tenant).stream().map(ZonaEntregaResponse::of).toList();
    }

    @PostMapping
    public ResponseEntity<ZonaEntregaResponse> criar(@PathVariable UUID tenant,
                                                       @Valid @RequestBody ZonaEntregaRequest request) {
        var zona = freteService.criarZona(tenant, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ZonaEntregaResponse.of(zona));
    }

    @PutMapping("/{zonaGuid}")
    public ZonaEntregaResponse atualizar(@PathVariable UUID tenant, @PathVariable UUID zonaGuid,
                                          @Valid @RequestBody ZonaEntregaRequest request) {
        return ZonaEntregaResponse.of(freteService.atualizarZona(tenant, zonaGuid, request));
    }

    @DeleteMapping("/{zonaGuid}")
    public ResponseEntity<Void> excluir(@PathVariable UUID tenant, @PathVariable UUID zonaGuid) {
        freteService.excluirZona(tenant, zonaGuid);
        return ResponseEntity.noContent().build();
    }
}
