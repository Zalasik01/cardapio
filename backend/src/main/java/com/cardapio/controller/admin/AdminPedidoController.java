package com.cardapio.controller.admin;

import com.cardapio.dto.pagamento.FormaPagamentoResponse;
import com.cardapio.service.ClientePedidoService;
import com.cardapio.service.FormaPagamentoService;
import com.cardapio.dto.pedido.PedidoRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    private final FormaPagamentoService formaPagamentoService;
    private final ClientePedidoService clientePedidoService;

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

    @PreAuthorize("@perm.tem('PEDIDOS_INCLUIR', 'PAINEL_PEDIDOS_INCLUIR')")
    @GetMapping("/produtos")
    public List<PedidoAdminService.ProdutoParaPedido> produtos(@PathVariable UUID tenant) {
        return pedidoService.produtosParaPedido(tenant);
    }

    @PreAuthorize("@perm.tem('PEDIDOS_INCLUIR', 'PAINEL_PEDIDOS_INCLUIR')")
    @GetMapping("/formas-pagamento")
    public List<FormaPagamentoResponse> formasPagamento(@PathVariable UUID tenant) {
        return formaPagamentoService.listarAtivas(tenant);
    }

    /** Clientes cadastrados que combinam com o texto (nome, apelido ou documento), para preencher o pedido. */
    @PreAuthorize("@perm.tem('PEDIDOS_INCLUIR', 'PAINEL_PEDIDOS_INCLUIR')")
    @GetMapping("/clientes")
    public List<ClientePedidoService.ClienteParaPedido> clientes(@PathVariable UUID tenant, @RequestParam String busca) {
        return clientePedidoService.buscar(tenant, busca);
    }

    /** Exclusão lógica do pedido. */
    @PreAuthorize("@perm.tem('PEDIDOS_EXCLUIR', 'PAINEL_PEDIDOS_EXCLUIR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID tenant, @PathVariable Long id) {
        pedidoService.excluir(tenant, id);
        return ResponseEntity.noContent().build();
    }

    /** Cria um pedido lançado pela loja (balcão, telefone...). */
    @PreAuthorize("@perm.tem('PEDIDOS_INCLUIR', 'PAINEL_PEDIDOS_INCLUIR')")
    @PostMapping
    public ResponseEntity<PedidoAdminResponse> criar(@PathVariable UUID tenant, @Valid @RequestBody PedidoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pedidoService.criar(tenant, request));
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
        return pedidoService.atualizarStatus(tenant, id, request);
    }
}
