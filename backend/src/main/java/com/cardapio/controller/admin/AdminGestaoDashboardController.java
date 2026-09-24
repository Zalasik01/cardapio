package com.cardapio.controller.admin;

import com.cardapio.dto.gestao.GestaoDashboardResponse;
import com.cardapio.service.GestaoDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Gestão Interna: números da plataforma. Liberado só ao usuário administrador (SecurityConfig). */
@RestController
@RequestMapping("/api/admin/gestao/dashboard")
@RequiredArgsConstructor
public class AdminGestaoDashboardController {

    private final GestaoDashboardService dashboardService;

    @GetMapping
    public GestaoDashboardResponse obter() {
        return dashboardService.montar();
    }
}
