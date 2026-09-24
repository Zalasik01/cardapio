package com.cardapio.controller.admin;

import com.cardapio.dto.gestao.AnotacaoRequest;
import com.cardapio.dto.gestao.AnotacaoResponse;
import com.cardapio.security.AppUserDetails;
import com.cardapio.service.GestaoAnotacaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Gestão Interna: anotações de uma loja. Liberado só ao usuário administrador (SecurityConfig). */
@RestController
@RequestMapping("/api/admin/gestao/lojas/{lojaId}/anotacoes")
@RequiredArgsConstructor
public class AdminGestaoAnotacaoController {

    private final GestaoAnotacaoService anotacaoService;

    @GetMapping
    public List<AnotacaoResponse> listar(@PathVariable Long lojaId) {
        return anotacaoService.listar(lojaId);
    }

    @PostMapping
    public ResponseEntity<AnotacaoResponse> criar(@PathVariable Long lojaId, @Valid @RequestBody AnotacaoRequest request,
                                                  @AuthenticationPrincipal AppUserDetails logado) {
        return ResponseEntity.status(HttpStatus.CREATED).body(anotacaoService.criar(lojaId, request, logado.getUsuarioId()));
    }

    @PutMapping("/{id}")
    public AnotacaoResponse atualizar(@PathVariable Long lojaId, @PathVariable Long id,
                                      @Valid @RequestBody AnotacaoRequest request) {
        return anotacaoService.atualizar(lojaId, id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long lojaId, @PathVariable Long id) {
        anotacaoService.excluir(lojaId, id);
        return ResponseEntity.noContent().build();
    }
}
