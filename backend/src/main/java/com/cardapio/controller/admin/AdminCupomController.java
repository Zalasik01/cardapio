package com.cardapio.controller.admin;

import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.cupom.CupomDtos.CupomRequest;
import com.cardapio.dto.cupom.CupomDtos.CupomResponse;
import com.cardapio.dto.usuario.AlterarAtivoRequest;
import com.cardapio.service.CupomService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** CRUD dos cupons da loja. O acesso ao tenant da URL é validado no SecurityConfig. */
@RestController
@RequestMapping("/api/admin/lojas/{tenant}/cupons")
@RequiredArgsConstructor
public class AdminCupomController {

    private final CupomService cupomService;

    @PreAuthorize("@perm.tem('CUPONS_LEITURA')")
    @GetMapping
    public PaginaResponse<CupomResponse> buscar(@PathVariable UUID tenant, @RequestParam(required = false) String busca,
                                                @RequestParam(defaultValue = "false") boolean mostrarInativos,
                                                @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return cupomService.buscar(tenant, busca, mostrarInativos, page, size);
    }

    @PreAuthorize("@perm.tem('CUPONS_LEITURA')")
    @GetMapping("/{id}")
    public CupomResponse obter(@PathVariable UUID tenant, @PathVariable Long id) {
        return cupomService.obter(tenant, id);
    }

    @PreAuthorize("@perm.tem('CUPONS_INCLUIR')")
    @PostMapping
    public ResponseEntity<CupomResponse> criar(@PathVariable UUID tenant, @Valid @RequestBody CupomRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cupomService.criar(tenant, request));
    }

    @PreAuthorize("@perm.tem('CUPONS_ALTERAR')")
    @PutMapping("/{id}")
    public CupomResponse atualizar(@PathVariable UUID tenant, @PathVariable Long id, @Valid @RequestBody CupomRequest request) {
        return cupomService.atualizar(tenant, id, request);
    }

    @PreAuthorize("@perm.tem('CUPONS_INATIVAR')")
    @PutMapping("/{id}/ativo")
    public ResponseEntity<Void> alterarAtivo(@PathVariable UUID tenant, @PathVariable Long id, @RequestBody AlterarAtivoRequest request) {
        cupomService.alterarAtivo(tenant, id, request.ativo());
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("@perm.tem('CUPONS_EXCLUIR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID tenant, @PathVariable Long id) {
        cupomService.excluir(tenant, id);
        return ResponseEntity.noContent().build();
    }
}
