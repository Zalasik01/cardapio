package com.cardapio.controller.admin;

import com.cardapio.dto.gestao.GestaoDashboardResponse;
import com.cardapio.dto.gestao.RecebimentosResponse;
import com.cardapio.service.GestaoDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

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

    /** Mensalidades pagas no período (início e fim inclusive, no máximo 90 dias). */
    @GetMapping("/recebimentos")
    public RecebimentosResponse recebimentos(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
                                             @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return dashboardService.recebimentos(inicio, fim);
    }
}
