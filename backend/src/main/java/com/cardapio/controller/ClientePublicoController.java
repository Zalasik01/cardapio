package com.cardapio.controller;

import com.cardapio.service.ClienteContaService;
import com.cardapio.service.ClienteContaService.CodigoEnviado;
import com.cardapio.service.ClienteContaService.ContaResponse;
import com.cardapio.service.ClienteContaService.Sessao;
import com.cardapio.service.HistoricoClienteService;
import com.cardapio.service.HistoricoClienteService.PedidoHistorico;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/** Conta do cliente final no cardápio online: entrar por telefone (OTP), perfil e histórico de pedidos. */
@RestController
@RequestMapping("/api/publico/cliente")
@RequiredArgsConstructor
public class ClientePublicoController {

    private final ClienteContaService contaService;
    private final HistoricoClienteService historicoService;

    public record SolicitarCodigoRequest(@NotBlank String telefone) {
    }

    public record VerificarCodigoRequest(@NotBlank String telefone, @NotBlank String codigo, String nome) {
    }

    public record NomeRequest(@NotBlank String nome) {
    }

    @PostMapping("/otp")
    public CodigoEnviado solicitarCodigo(@Valid @RequestBody SolicitarCodigoRequest request) {
        return contaService.solicitarCodigo(request.telefone());
    }

    @PostMapping("/otp/verificar")
    public Sessao verificar(@Valid @RequestBody VerificarCodigoRequest request) {
        return contaService.verificar(request.telefone(), request.codigo(), request.nome());
    }

    @GetMapping("/eu")
    public ContaResponse eu(@RequestHeader(value = "Authorization", required = false) String auth) {
        return contaService.resposta(contaService.autenticar(auth));
    }

    @PutMapping("/eu")
    public ContaResponse atualizarNome(@RequestHeader(value = "Authorization", required = false) String auth,
                                       @Valid @RequestBody NomeRequest request) {
        return contaService.atualizarNome(contaService.autenticar(auth), request.nome());
    }

    @GetMapping("/pedidos")
    public List<PedidoHistorico> pedidos(@RequestHeader(value = "Authorization", required = false) String auth,
                                         @RequestParam String slug) {
        return historicoService.listar(contaService.autenticar(auth), slug);
    }
}
