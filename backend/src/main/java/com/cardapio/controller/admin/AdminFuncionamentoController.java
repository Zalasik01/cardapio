package com.cardapio.controller.admin;

import com.cardapio.dto.funcionamento.FuncionamentoRequest;
import com.cardapio.dto.funcionamento.FuncionamentoResponse;
import com.cardapio.entity.ModoFuncionamento;
import com.cardapio.service.FuncionamentoService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/** Horário de funcionamento e estado (aberta/fechada) da loja. O acesso ao tenant da URL é validado no SecurityConfig. */
@RestController
@RequestMapping("/api/admin/lojas/{tenant}/funcionamento")
@RequiredArgsConstructor
public class AdminFuncionamentoController {

    private final FuncionamentoService funcionamentoService;

    public record ModoRequest(@NotNull ModoFuncionamento modo) {
    }

    /** Modo, estado atual e a lista de horários (tela Minha loja). */
    @GetMapping
    public FuncionamentoResponse obter(@PathVariable UUID tenant) {
        return funcionamentoService.obter(tenant);
    }

    /** Só o estado atual, leve: o selo "Loja aberta/fechada" do cabeçalho consulta por aqui. */
    @GetMapping("/situacao")
    public FuncionamentoResponse situacao(@PathVariable UUID tenant) {
        return funcionamentoService.situacao(tenant);
    }

    @PutMapping
    public FuncionamentoResponse salvar(@PathVariable UUID tenant, @Valid @RequestBody FuncionamentoRequest request) {
        return funcionamentoService.salvar(tenant, request);
    }

    /** Abrir/fechar agora ou voltar ao horário automático. */
    @PutMapping("/modo")
    public FuncionamentoResponse alterarModo(@PathVariable UUID tenant, @Valid @RequestBody ModoRequest request) {
        return funcionamentoService.alterarModo(tenant, request.modo());
    }
}
