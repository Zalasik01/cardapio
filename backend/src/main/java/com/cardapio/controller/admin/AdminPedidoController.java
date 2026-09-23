package com.cardapio.controller.admin;

import com.cardapio.dto.pedido.PedidoResponse;
import com.cardapio.service.PedidoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/restaurantes/{restauranteId}/pedidos")
@RequiredArgsConstructor
public class AdminPedidoController {

    private final PedidoService pedidoService;

    @GetMapping
    public List<PedidoResponse> listar(@PathVariable Long restauranteId) {
        return pedidoService.listarPorRestaurante(restauranteId).stream().map(PedidoResponse::of).toList();
    }
}
