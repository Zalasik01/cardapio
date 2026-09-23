package com.cardapio.controller;

import com.cardapio.dto.auth.AuthResponse;
import com.cardapio.dto.auth.LoginRequest;
import com.cardapio.dto.auth.RefreshTokenRequest;
import com.cardapio.dto.auth.SelecionarLojaRequest;
import com.cardapio.dto.loja.LojaResponse;
import com.cardapio.security.AppUserDetails;
import com.cardapio.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return authService.renovar(request.refreshToken());
    }

    /** Lojas que o usuario logado pode acessar (todas, para o usuario do sistema); busca filtra pelo nome. */
    @GetMapping("/lojas")
    public List<LojaResponse> lojas(@AuthenticationPrincipal AppUserDetails usuario,
                                    @RequestParam(required = false) String busca) {
        return authService.listarLojasAcessiveis(usuario.getUsuarioId(), busca);
    }

    /** Vincula a sessao a uma loja e devolve novos tokens com o tenant e o papel nela. */
    @PostMapping("/selecionar-loja")
    public AuthResponse selecionarLoja(@AuthenticationPrincipal AppUserDetails usuario,
                                       @Valid @RequestBody SelecionarLojaRequest request) {
        return authService.selecionarLoja(usuario.getUsuarioId(), request.lojaGuid());
    }
}
