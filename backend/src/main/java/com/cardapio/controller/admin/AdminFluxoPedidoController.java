package com.cardapio.controller.admin;

import com.cardapio.dto.pedido.FluxoDtos.FluxoRequest;
import com.cardapio.dto.pedido.FluxoDtos.FluxoResponse;
import com.cardapio.service.FluxoPedidoService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Fluxo de pedidos da loja: as situações (colunas do kanban) e as passagens entre elas. */
@RestController
@RequestMapping("/api/admin/lojas/{tenant}/fluxo-pedidos")
@RequiredArgsConstructor
public class AdminFluxoPedidoController {

    private final FluxoPedidoService fluxoService;

    /** Quem vê pedidos precisa das situações para montar o quadro e os filtros. */
    @PreAuthorize("@perm.tem('FLUXO_PEDIDOS_LEITURA', 'PEDIDOS_LEITURA', 'PAINEL_PEDIDOS_LEITURA')")
    @GetMapping
    public FluxoResponse obter(@PathVariable UUID tenant) {
        return fluxoService.obter(tenant);
    }

    @PreAuthorize("@perm.tem('FLUXO_PEDIDOS_ALTERAR')")
    @PutMapping
    public FluxoResponse salvar(@PathVariable UUID tenant, @Valid @RequestBody FluxoRequest request) {
        return fluxoService.salvar(tenant, request);
    }

    @PreAuthorize("@perm.tem('FLUXO_PEDIDOS_ALTERAR')")
    @PostMapping("/restaurar-padrao")
    public FluxoResponse restaurarPadrao(@PathVariable UUID tenant) {
        return fluxoService.restaurarPadrao(tenant);
    }
}
