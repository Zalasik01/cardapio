package com.cardapio.controller.admin;

import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.pagamento.FormaPagamentoRequest;
import com.cardapio.dto.usuario.AlterarAtivoRequest;
import com.cardapio.dto.pagamento.FormaPagamentoResponse;
import com.cardapio.service.FormaPagamentoService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** CRUD e busca das formas de pagamento. O acesso ao tenant da URL é validado no SecurityConfig. */
@RestController
@RequestMapping("/api/admin/lojas/{tenant}/formas-pagamento")
@RequiredArgsConstructor
public class AdminFormaPagamentoController {

    private final FormaPagamentoService formaService;

    @PreAuthorize("@perm.tem('FORMAS_PAGAMENTO_LEITURA')")
    @GetMapping
    public PaginaResponse<FormaPagamentoResponse> buscar(@PathVariable UUID tenant,
                                                         @RequestParam(required = false) String busca,
                                                         @RequestParam(defaultValue = "false") boolean mostrarInativos,
                                                         @RequestParam(defaultValue = "0") int page,
                                                         @RequestParam(defaultValue = "10") int size) {
        return formaService.buscar(tenant, busca, mostrarInativos, page, size);
    }

    public record OrdemResponse(int ordem) {
    }

    /** Próxima posição livre (maior ordem + 1), sugerida ao cadastrar. */
    @PreAuthorize("@perm.tem('FORMAS_PAGAMENTO_INCLUIR')")
    @GetMapping("/proxima-ordem")
    public OrdemResponse proximaOrdem(@PathVariable UUID tenant) {
        return new OrdemResponse(formaService.proximaOrdem(tenant));
    }

    @PreAuthorize("@perm.tem('FORMAS_PAGAMENTO_LEITURA')")
    @GetMapping("/{id}")
    public FormaPagamentoResponse obter(@PathVariable UUID tenant, @PathVariable Long id) {
        return formaService.obter(tenant, id);
    }

    @PreAuthorize("@perm.tem('FORMAS_PAGAMENTO_INCLUIR')")
    @PostMapping
    public ResponseEntity<FormaPagamentoResponse> criar(@PathVariable UUID tenant,
                                                        @Valid @RequestBody FormaPagamentoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(formaService.criar(tenant, request));
    }

    @PreAuthorize("@perm.tem('FORMAS_PAGAMENTO_ALTERAR')")
    @PutMapping("/{id}")
    public FormaPagamentoResponse atualizar(@PathVariable UUID tenant, @PathVariable Long id,
                                            @Valid @RequestBody FormaPagamentoRequest request) {
        return formaService.atualizar(tenant, id, request);
    }

    @PreAuthorize("@perm.tem('FORMAS_PAGAMENTO_INATIVAR')")
    @PutMapping("/{id}/ativo")
    public ResponseEntity<Void> alterarAtivo(@PathVariable UUID tenant, @PathVariable Long id,
                                             @RequestBody AlterarAtivoRequest request) {
        formaService.alterarAtivo(tenant, id, request.ativo());
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("@perm.tem('FORMAS_PAGAMENTO_EXCLUIR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID tenant, @PathVariable Long id) {
        formaService.excluir(tenant, id);
        return ResponseEntity.noContent().build();
    }
}
