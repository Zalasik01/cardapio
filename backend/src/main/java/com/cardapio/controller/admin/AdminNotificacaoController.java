package com.cardapio.controller.admin;

import com.cardapio.dto.notificacao.NotificacaoResponse;
import com.cardapio.service.NotificacaoService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Histórico do sino (as últimas notificações da loja). Novas chegam em tempo real pelo fluxo de eventos de pedidos. */
@RestController
@RequestMapping("/api/admin/lojas/{tenant}/notificacoes")
@RequiredArgsConstructor
public class AdminNotificacaoController {

    private final NotificacaoService notificacaoService;

    @PreAuthorize("@perm.tem('PEDIDOS_LEITURA', 'PAINEL_PEDIDOS_LEITURA')")
    @GetMapping
    public List<NotificacaoResponse> listar(@PathVariable UUID tenant) {
        return notificacaoService.listar(tenant);
    }
}
