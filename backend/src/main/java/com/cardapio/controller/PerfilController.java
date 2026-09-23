package com.cardapio.controller;

import com.cardapio.dto.auth.UsuarioLogadoResponse;
import com.cardapio.dto.perfil.AlterarSenhaRequest;
import com.cardapio.dto.perfil.PerfilRequest;
import com.cardapio.security.AppUserDetails;
import com.cardapio.service.PerfilService;
import com.cardapio.service.UsuarioFotoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;

/** Endpoints do proprio usuario logado ("Seu perfil"); qualquer usuario autenticado acessa o seu. */
@RestController
@RequestMapping("/api/perfil")
@RequiredArgsConstructor
public class PerfilController {

    private final PerfilService perfilService;
    private final UsuarioFotoService fotoService;

    @PutMapping
    public UsuarioLogadoResponse atualizar(@AuthenticationPrincipal AppUserDetails logado,
                                           @Valid @RequestBody PerfilRequest request) {
        return perfilService.atualizar(logado.getUsuarioId(), request.nome(), request.whatsapp(), logado.getPerfil());
    }

    @PutMapping("/senha")
    public ResponseEntity<Void> alterarSenha(@AuthenticationPrincipal AppUserDetails logado,
                                             @Valid @RequestBody AlterarSenhaRequest request) {
        perfilService.alterarSenha(logado.getUsuarioId(), request.senhaAtual(), request.novaSenha());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/foto")
    public ResponseEntity<byte[]> obterFoto(@AuthenticationPrincipal AppUserDetails logado) {
        var foto = fotoService.obterDoUsuario(logado.getUsuarioId());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(foto.tipoConteudo()))
                .cacheControl(CacheControl.noCache().cachePrivate())
                .body(foto.conteudo());
    }

    @PutMapping(path = "/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> salvarFoto(@AuthenticationPrincipal AppUserDetails logado,
                                           @RequestParam("arquivo") MultipartFile arquivo) {
        fotoService.salvarDoUsuario(logado.getUsuarioId(), arquivo);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/foto")
    public ResponseEntity<Void> removerFoto(@AuthenticationPrincipal AppUserDetails logado) {
        fotoService.removerDoUsuario(logado.getUsuarioId());
        return ResponseEntity.noContent().build();
    }
}
