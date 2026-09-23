package com.cardapio.controller;

import com.cardapio.dto.auth.AuthResponse;
import com.cardapio.dto.auth.ConviteInfoResponse;
import com.cardapio.dto.auth.DefinirSenhaRequest;
import com.cardapio.service.NovoUsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Endpoints publicos do link de novo usuario (o token do link e a credencial). */
@RestController
@RequestMapping("/api/auth/novo-usuario")
@RequiredArgsConstructor
public class NovoUsuarioController {

    private final NovoUsuarioService novoUsuarioService;

    @GetMapping("/{token}")
    public ConviteInfoResponse consultar(@PathVariable String token) {
        return novoUsuarioService.consultar(token);
    }

    /** Define a senha e ja devolve a sessao (login) do usuario. */
    @PostMapping("/{token}")
    public AuthResponse definirSenha(@PathVariable String token, @Valid @RequestBody DefinirSenhaRequest request) {
        return novoUsuarioService.definirSenha(token, request.senha());
    }
}
