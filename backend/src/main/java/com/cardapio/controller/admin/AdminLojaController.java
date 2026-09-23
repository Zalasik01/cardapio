package com.cardapio.controller.admin;

import com.cardapio.dto.loja.LojaRequest;
import com.cardapio.dto.loja.LojaResponse;
import com.cardapio.service.LojaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/lojas")
@RequiredArgsConstructor
public class AdminLojaController {

    private final LojaService lojaService;

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<LojaResponse> criar(@Valid @RequestBody LojaRequest request) {
        var loja = lojaService.criar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(LojaResponse.of(loja));
    }

    @GetMapping("/{tenant}")
    public LojaResponse buscarPorTenant(@PathVariable UUID tenant) {
        return LojaResponse.of(lojaService.buscarPorTenant(tenant));
    }

    @PutMapping("/{tenant}")
    public LojaResponse atualizar(@PathVariable UUID tenant, @Valid @RequestBody LojaRequest request) {
        return LojaResponse.of(lojaService.atualizar(tenant, request));
    }

    @DeleteMapping("/{tenant}")
    @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> inativar(@PathVariable UUID tenant) {
        lojaService.inativar(tenant);
        return ResponseEntity.noContent().build();
    }
}
