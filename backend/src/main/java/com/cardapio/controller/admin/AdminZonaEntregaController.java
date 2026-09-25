package com.cardapio.controller.admin;

import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.frete.ZonaCadastroRequest;
import com.cardapio.dto.frete.ZonaCadastroResponse;
import com.cardapio.dto.usuario.AlterarAtivoRequest;
import com.cardapio.service.ZonaEntregaCadastroService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/** CRUD e busca das zonas de entrega. O acesso ao tenant da URL é validado no SecurityConfig. */
@RestController
@RequestMapping("/api/admin/lojas/{tenant}/zonas-entrega")
@RequiredArgsConstructor
public class AdminZonaEntregaController {

    private final ZonaEntregaCadastroService zonaService;

    @GetMapping
    public PaginaResponse<ZonaCadastroResponse> buscar(@PathVariable UUID tenant,
                                                       @RequestParam(required = false) String busca,
                                                       @RequestParam(defaultValue = "false") boolean mostrarInativos,
                                                       @RequestParam(defaultValue = "0") int page,
                                                       @RequestParam(defaultValue = "10") int size) {
        return zonaService.buscar(tenant, busca, mostrarInativos, page, size);
    }

    @GetMapping("/{id}")
    public ZonaCadastroResponse obter(@PathVariable UUID tenant, @PathVariable Long id) {
        return zonaService.obter(tenant, id);
    }

    @PostMapping
    public ResponseEntity<ZonaCadastroResponse> criar(@PathVariable UUID tenant,
                                                      @Valid @RequestBody ZonaCadastroRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(zonaService.criar(tenant, request));
    }

    @PutMapping("/{id}")
    public ZonaCadastroResponse atualizar(@PathVariable UUID tenant, @PathVariable Long id,
                                          @Valid @RequestBody ZonaCadastroRequest request) {
        return zonaService.atualizar(tenant, id, request);
    }

    @PutMapping("/{id}/ativo")
    public ResponseEntity<Void> alterarAtivo(@PathVariable UUID tenant, @PathVariable Long id,
                                             @RequestBody AlterarAtivoRequest request) {
        zonaService.alterarAtivo(tenant, id, request.ativo());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID tenant, @PathVariable Long id) {
        zonaService.excluir(tenant, id);
        return ResponseEntity.noContent().build();
    }
}
