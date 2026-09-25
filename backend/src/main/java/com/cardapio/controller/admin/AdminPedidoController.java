package com.cardapio.controller.admin;

import com.cardapio.service.PedidoEventos;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.pedido.AtualizarStatusPedidoRequest;
import com.cardapio.dto.pedido.PedidoAdminResponse;
import com.cardapio.dto.pedido.PedidoAdminResumoResponse;
import com.cardapio.dto.pedido.PedidoPeriodoResumoResponse;
import com.cardapio.entity.StatusPedido;
import com.cardapio.entity.TipoEntrega;
import com.cardapio.service.PedidoAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

/** Pedidos da loja no painel: busca por período, detalhe, andamento e resumo. Tenant validado no SecurityConfig. */
@RestController
@RequestMapping("/api/admin/lojas/{tenant}/pedidos")
@RequiredArgsConstructor
public class AdminPedidoController {

    private final PedidoAdminService pedidoService;
    private final PedidoEventos pedidoEventos;

    /** inicio e fim (yyyy-MM-dd, inclusive, no máximo 90 dias) são obrigatórios. */
    @PreAuthorize("@perm.tem('PEDIDOS_LEITURA')")
    @GetMapping
    public PaginaResponse<PedidoAdminResumoResponse> buscar(
            @PathVariable UUID tenant,
            @RequestParam(required = false) String busca,
            @RequestParam(required = false) StatusPedido status,
            @RequestParam(required = false) TipoEntrega tipoEntrega,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return pedidoService.buscar(tenant, new PedidoAdminService.Filtro(busca, status, tipoEntrega, inicio, fim), page, size);
    }

    /** Números do dashboard: pedidos do período, entregues, faturamento e quantos estão em andamento. */
    @PreAuthorize("@perm.tem('PEDIDOS_LEITURA', 'DASHBOARD_LEITURA')")
    @GetMapping("/resumo")
    public PedidoPeriodoResumoResponse resumo(@PathVariable UUID tenant,
                                              @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
                                              @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return pedidoService.resumo(tenant, inicio, fim);
    }

    /** Pedidos do painel (kanban): em andamento e encerrados hoje. */
    @PreAuthorize("@perm.tem('PAINEL_PEDIDOS_LEITURA')")
    @GetMapping("/quadro")
    public List<PedidoAdminResponse> quadro(@PathVariable UUID tenant) {
        return pedidoService.quadro(tenant);
    }

    /** Fluxo de eventos (SSE): o painel recebe um aviso quando chega pedido novo ou um pedido muda de situação. */
    @PreAuthorize("@perm.tem('PAINEL_PEDIDOS_LEITURA')")
    @GetMapping(value = "/eventos", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter eventos(@PathVariable UUID tenant) {
        return pedidoEventos.inscrever(tenant);
    }

    @PreAuthorize("@perm.tem('PEDIDOS_LEITURA', 'PAINEL_PEDIDOS_LEITURA')")
    @GetMapping("/{id}")
    public PedidoAdminResponse obter(@PathVariable UUID tenant, @PathVariable Long id) {
        return pedidoService.obter(tenant, id);
    }

    @PreAuthorize("@perm.tem('PEDIDOS_ALTERAR_STATUS', 'PEDIDOS_CANCELAR', 'PAINEL_PEDIDOS_ALTERAR_STATUS', 'PAINEL_PEDIDOS_CANCELAR')")
    @PutMapping("/{id}/status")
    public PedidoAdminResponse atualizarStatus(@PathVariable UUID tenant, @PathVariable Long id,
                                               @Valid @RequestBody AtualizarStatusPedidoRequest request) {
        return pedidoService.atualizarStatus(tenant, id, request.status());
    }
}
