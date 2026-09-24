package com.cardapio.controller.admin;

import com.cardapio.dto.gestao.MensalidadeRequest;
import com.cardapio.dto.gestao.MensalidadeResponse;
import com.cardapio.service.GestaoMensalidadeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Gestão Interna: mensalidades de uma loja. Liberado só ao usuário administrador (SecurityConfig). */
@RestController
@RequestMapping("/api/admin/gestao/lojas/{lojaId}/mensalidades")
@RequiredArgsConstructor
public class AdminGestaoMensalidadeController {

    private final GestaoMensalidadeService mensalidadeService;

    @GetMapping
    public List<MensalidadeResponse> listar(@PathVariable Long lojaId) {
        return mensalidadeService.listar(lojaId);
    }

    @PostMapping
    public ResponseEntity<MensalidadeResponse> criar(@PathVariable Long lojaId,
                                                     @Valid @RequestBody MensalidadeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(mensalidadeService.criar(lojaId, request));
    }

    @PutMapping("/{id}")
    public MensalidadeResponse atualizar(@PathVariable Long lojaId, @PathVariable Long id,
                                         @Valid @RequestBody MensalidadeRequest request) {
        return mensalidadeService.atualizar(lojaId, id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long lojaId, @PathVariable Long id) {
        mensalidadeService.excluir(lojaId, id);
        return ResponseEntity.noContent().build();
    }
}
