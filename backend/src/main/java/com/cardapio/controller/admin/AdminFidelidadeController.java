package com.cardapio.controller.admin;

import com.cardapio.service.FidelidadeService;
import com.cardapio.service.FidelidadeService.ConfigRequest;
import com.cardapio.service.FidelidadeService.ConfigResponse;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** Configuração do programa de fidelidade (cashback). O acesso ao tenant da URL é validado no SecurityConfig. */
@RestController
@RequestMapping("/api/admin/lojas/{tenant}/fidelidade")
@RequiredArgsConstructor
public class AdminFidelidadeController {

    private final FidelidadeService service;

    @PreAuthorize("@perm.tem('FIDELIDADE_LEITURA')")
    @GetMapping
    public ConfigResponse obter(@PathVariable UUID tenant) {
        return service.config(tenant);
    }

    @PreAuthorize("@perm.tem('FIDELIDADE_ALTERAR')")
    @PutMapping
    public ConfigResponse salvar(@PathVariable UUID tenant, @RequestBody ConfigRequest request) {
        return service.salvar(tenant, request);
    }
}
