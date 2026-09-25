package com.cardapio.controller.admin;

import org.springframework.security.access.prepost.PreAuthorize;
import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.categoria.CategoriaCadastroRequest;
import com.cardapio.dto.categoria.CategoriaCadastroResponse;
import com.cardapio.dto.usuario.AlterarAtivoRequest;
import com.cardapio.service.CategoriaCadastroService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/** CRUD e busca das categorias do cardápio. O acesso ao tenant da URL é validado no SecurityConfig. */
@RestController
@RequestMapping("/api/admin/lojas/{tenant}/categorias")
@RequiredArgsConstructor
public class AdminCategoriaController {

    private final CategoriaCadastroService categoriaService;

    @PreAuthorize("@perm.tem('CATEGORIAS_LEITURA')")
    @GetMapping
    public PaginaResponse<CategoriaCadastroResponse> buscar(@PathVariable UUID tenant,
                                                            @RequestParam(required = false) String busca,
                                                            @RequestParam(defaultValue = "false") boolean mostrarInativos,
                                                            @RequestParam(defaultValue = "0") int page,
                                                            @RequestParam(defaultValue = "10") int size) {
        return categoriaService.buscar(tenant, busca, mostrarInativos, page, size);
    }

    @PreAuthorize("@perm.tem('CATEGORIAS_LEITURA')")
    @GetMapping("/{id}")
    public CategoriaCadastroResponse obter(@PathVariable UUID tenant, @PathVariable Long id) {
        return categoriaService.obter(tenant, id);
    }

    @PreAuthorize("@perm.tem('CATEGORIAS_INCLUIR')")
    @PostMapping
    public ResponseEntity<CategoriaCadastroResponse> criar(@PathVariable UUID tenant,
                                                           @Valid @RequestBody CategoriaCadastroRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoriaService.criar(tenant, request));
    }

    @PreAuthorize("@perm.tem('CATEGORIAS_ALTERAR')")
    @PutMapping("/{id}")
    public CategoriaCadastroResponse atualizar(@PathVariable UUID tenant, @PathVariable Long id,
                                               @Valid @RequestBody CategoriaCadastroRequest request) {
        return categoriaService.atualizar(tenant, id, request);
    }

    @PreAuthorize("@perm.tem('CATEGORIAS_INATIVAR')")
    @PutMapping("/{id}/ativo")
    public ResponseEntity<Void> alterarAtivo(@PathVariable UUID tenant, @PathVariable Long id,
                                             @RequestBody AlterarAtivoRequest request) {
        categoriaService.alterarAtivo(tenant, id, request.ativo());
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("@perm.tem('CATEGORIAS_EXCLUIR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID tenant, @PathVariable Long id) {
        categoriaService.excluir(tenant, id);
        return ResponseEntity.noContent().build();
    }
}
