package com.cardapio.controller.admin;

import com.cardapio.service.SiteLojaService;
import com.cardapio.service.SiteLojaService.SiteRequest;
import com.cardapio.service.SiteLojaService.SiteResponse;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** Personalização do site da loja. O acesso ao tenant da URL é validado no SecurityConfig. */
@RestController
@RequestMapping("/api/admin/lojas/{tenant}/site")
@RequiredArgsConstructor
public class AdminSiteController {

    private final SiteLojaService service;

    @PreAuthorize("@perm.tem('SITE_LEITURA')")
    @GetMapping
    public SiteResponse obter(@PathVariable UUID tenant) {
        return service.obter(tenant);
    }

    @PreAuthorize("@perm.tem('SITE_ALTERAR')")
    @PutMapping
    public SiteResponse salvar(@PathVariable UUID tenant, @RequestBody SiteRequest request) {
        return service.salvar(tenant, request);
    }
}
