package com.cardapio.controller;

import com.cardapio.dto.pedido.PedidoRequest;
import com.cardapio.dto.pedido.PedidoResponse;
import com.cardapio.entity.T_Pedido;
import com.cardapio.service.PedidoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/pedidos")
@RequiredArgsConstructor
public class PedidoController {

    private final PedidoService pedidoService;
    private final com.cardapio.service.ClienteContaService contaService;

    @PostMapping
    public ResponseEntity<PedidoResponse> criar(@RequestHeader(value = "Authorization", required = false) String auth,
                                                @Valid @RequestBody PedidoRequest request) {
        // pedir exige entrar com o telefone (OTP): o pedido fica na conta do cliente
        T_Pedido pedido = pedidoService.criarParaCliente(request, contaService.autenticar(auth));
        return ResponseEntity.status(HttpStatus.CREATED).body(PedidoResponse.of(pedido));
    }

    @GetMapping("/{guid}")
    public PedidoResponse buscarPorGuid(@PathVariable UUID guid) {
        return PedidoResponse.of(pedidoService.buscarPorGuid(guid));
    }
}
