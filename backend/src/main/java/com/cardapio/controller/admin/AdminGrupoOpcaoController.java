package com.cardapio.controller.admin;

import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.usuario.AlterarAtivoRequest;
import com.cardapio.service.OpcaoService;
import com.cardapio.service.OpcaoService.GrupoRequest;
import com.cardapio.service.OpcaoService.GrupoResponse;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** Adicionais e variações (grupos de opções). O acesso ao tenant da URL é validado no SecurityConfig. */
@RestController
@RequestMapping("/api/admin/lojas/{tenant}/grupos-opcao")
@RequiredArgsConstructor
public class AdminGrupoOpcaoController {

    private final OpcaoService service;

    @PreAuthorize("@perm.tem('GRUPOS_OPCAO_LEITURA')")
    @GetMapping
    public PaginaResponse<GrupoResponse> buscar(@PathVariable UUID tenant, @RequestParam(required = false) String busca,
                                                @RequestParam(defaultValue = "false") boolean mostrarInativos,
                                                @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return service.buscar(tenant, busca, mostrarInativos, page, size);
    }

    /** Todos os grupos ativos: o cadastro de produto escolhe entre eles. */
    @PreAuthorize("@perm.tem('GRUPOS_OPCAO_LEITURA', 'PRODUTOS_FINAIS_LEITURA')")
    @GetMapping("/ativos")
    public List<GrupoResponse> ativos(@PathVariable UUID tenant) {
        return service.listarAtivos(tenant);
    }

    @PreAuthorize("@perm.tem('GRUPOS_OPCAO_LEITURA')")
    @GetMapping("/{id}")
    public GrupoResponse obter(@PathVariable UUID tenant, @PathVariable Long id) {
        return service.obter(tenant, id);
    }

    @PreAuthorize("@perm.tem('GRUPOS_OPCAO_INCLUIR')")
    @PostMapping
    public ResponseEntity<GrupoResponse> criar(@PathVariable UUID tenant, @RequestBody GrupoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(tenant, request));
    }

    @PreAuthorize("@perm.tem('GRUPOS_OPCAO_ALTERAR')")
    @PutMapping("/{id}")
    public GrupoResponse atualizar(@PathVariable UUID tenant, @PathVariable Long id, @RequestBody GrupoRequest request) {
        return service.atualizar(tenant, id, request);
    }

    @PreAuthorize("@perm.tem('GRUPOS_OPCAO_INATIVAR')")
    @PutMapping("/{id}/ativo")
    public ResponseEntity<Void> alterarAtivo(@PathVariable UUID tenant, @PathVariable Long id, @RequestBody AlterarAtivoRequest request) {
        service.alterarAtivo(tenant, id, request.ativo());
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("@perm.tem('GRUPOS_OPCAO_EXCLUIR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID tenant, @PathVariable Long id) {
        service.excluir(tenant, id);
        return ResponseEntity.noContent().build();
    }
}
