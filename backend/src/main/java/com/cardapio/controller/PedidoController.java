package com.cardapio.controller;

import com.cardapio.dto.pedido.AtualizarStatusPedidoRequest;
import com.cardapio.dto.pedido.PedidoRequest;
import com.cardapio.dto.pedido.PedidoResponse;
import com.cardapio.entity.T_Pedido;
import com.cardapio.service.PedidoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/pedidos")
@RequiredArgsConstructor
public class PedidoController {

    private final PedidoService pedidoService;

    @PostMapping
    public ResponseEntity<PedidoResponse> criar(@Valid @RequestBody PedidoRequest request) {
        T_Pedido pedido = pedidoService.criar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(PedidoResponse.of(pedido));
    }

    @GetMapping("/{guid}")
    public PedidoResponse buscarPorGuid(@PathVariable UUID guid) {
        return PedidoResponse.of(pedidoService.buscarPorGuid(guid));
    }

    @PatchMapping("/{guid}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'ROLE_ADMIN_LOJA')")
    public PedidoResponse atualizarStatus(@PathVariable UUID guid, @Valid @RequestBody AtualizarStatusPedidoRequest request) {
        return PedidoResponse.of(pedidoService.atualizarStatus(guid, request.status()));
    }
}
