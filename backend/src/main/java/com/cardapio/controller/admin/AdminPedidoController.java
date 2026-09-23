package com.cardapio.controller.admin;

import com.cardapio.dto.pedido.PedidoResponse;
import com.cardapio.service.PedidoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/lojas/{tenant}/pedidos")
@RequiredArgsConstructor
public class AdminPedidoController {

    private final PedidoService pedidoService;

    @GetMapping
    public List<PedidoResponse> listar(@PathVariable UUID tenant) {
        return pedidoService.listarPorTenant(tenant).stream().map(PedidoResponse::of).toList();
    }
}
