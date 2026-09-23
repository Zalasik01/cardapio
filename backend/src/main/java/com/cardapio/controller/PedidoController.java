package com.cardapio.controller;

import com.cardapio.dto.pedido.AtualizarStatusPedidoRequest;
import com.cardapio.dto.pedido.PedidoRequest;
import com.cardapio.dto.pedido.PedidoResponse;
import com.cardapio.entity.Pedido;
import com.cardapio.service.PedidoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pedidos")
@RequiredArgsConstructor
public class PedidoController {

    private final PedidoService pedidoService;

    @PostMapping
    public ResponseEntity<PedidoResponse> criar(@Valid @RequestBody PedidoRequest request) {
        Pedido pedido = pedidoService.criar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(PedidoResponse.of(pedido));
    }

    @GetMapping("/{id}")
    public PedidoResponse buscarPorId(@PathVariable Long id) {
        return PedidoResponse.of(pedidoService.buscarPorId(id));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'ROLE_ADMIN_RESTAURANTE')")
    public PedidoResponse atualizarStatus(@PathVariable Long id, @Valid @RequestBody AtualizarStatusPedidoRequest request) {
        return PedidoResponse.of(pedidoService.atualizarStatus(id, request.status()));
    }
}
