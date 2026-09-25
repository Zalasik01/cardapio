package com.cardapio.controller.admin;

import org.springframework.security.access.prepost.PreAuthorize;
import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.produto.FiltroProdutoCadastro;
import com.cardapio.dto.produto.ProdutoCadastroRequest;
import com.cardapio.dto.produto.ProdutoCadastroResponse;
import com.cardapio.dto.produto.ProdutoCadastroResumoResponse;
import com.cardapio.dto.usuario.AlterarAtivoRequest;
import com.cardapio.entity.TipoProduto;
import com.cardapio.service.ProdutoCadastroService;
import com.cardapio.service.ProdutoCadastroService.OpcaoCategoria;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * CRUD e busca de produtos da loja (produto final e ingrediente). O acesso ao tenant da URL é validado no
 * SecurityConfig. As rotas antigas /produtos (por guid) continuam servindo o cardápio e a tela legada.
 */
@RestController
@RequestMapping("/api/admin/lojas/{tenant}/cadastro-produtos")
@RequiredArgsConstructor
public class AdminProdutoCadastroController {

    private final ProdutoCadastroService produtoService;

    @PreAuthorize("@perm.tem('PRODUTOS_FINAIS_LEITURA', 'INGREDIENTES_LEITURA')")
    @GetMapping
    public PaginaResponse<ProdutoCadastroResumoResponse> buscar(@PathVariable UUID tenant,
                                                                @RequestParam TipoProduto tipo,
                                                                @RequestParam(required = false) String busca,
                                                                @RequestParam(required = false) Long categoriaId,
                                                                @RequestParam(defaultValue = "false") boolean mostrarInativos,
                                                                @RequestParam(defaultValue = "0") int page,
                                                                @RequestParam(defaultValue = "10") int size) {
        return produtoService.buscar(tenant, new FiltroProdutoCadastro(tipo, busca, categoriaId, mostrarInativos), page, size);
    }

    public record CodigoResponse(String codigo) {
    }

    /** Sugestão de código para um produto novo (incremental por loja); o usuário pode alterá-lo. */
    @PreAuthorize("@perm.tem('PRODUTOS_FINAIS_INCLUIR', 'INGREDIENTES_INCLUIR')")
    @GetMapping("/proximo-codigo")
    public CodigoResponse proximoCodigo(@PathVariable UUID tenant) {
        return new CodigoResponse(produtoService.proximoCodigo(tenant));
    }

    public record DisponibilidadeResponse(boolean disponivel) {
    }

    /** O código está livre? Usado enquanto o usuário digita. produtoId é o produto em edição, se houver. */
    @PreAuthorize("@perm.tem('PRODUTOS_FINAIS_INCLUIR', 'INGREDIENTES_INCLUIR')")
    @GetMapping("/codigo-disponivel")
    public DisponibilidadeResponse codigoDisponivel(@PathVariable UUID tenant, @RequestParam String codigo,
                                                    @RequestParam(required = false) Long produtoId) {
        return new DisponibilidadeResponse(produtoService.codigoDisponivel(tenant, codigo, produtoId));
    }

    /** Categorias do cardápio (id e nome) para o campo de seleção do produto final. */
    @PreAuthorize("@perm.tem('PRODUTOS_FINAIS_LEITURA', 'INGREDIENTES_LEITURA')")
    @GetMapping("/categorias")
    public List<OpcaoCategoria> categorias(@PathVariable UUID tenant) {
        return produtoService.categorias(tenant);
    }

    @PreAuthorize("@perm.tem('PRODUTOS_FINAIS_LEITURA', 'INGREDIENTES_LEITURA')")
    @GetMapping("/{id}")
    public ProdutoCadastroResponse obter(@PathVariable UUID tenant, @PathVariable Long id) {
        return produtoService.obter(tenant, id);
    }

    @PreAuthorize("@perm.tem(#request.tipo().name() == 'FINAL' ? 'PRODUTOS_FINAIS_INCLUIR' : 'INGREDIENTES_INCLUIR')")
    @PostMapping
    public ResponseEntity<ProdutoCadastroResponse> criar(@PathVariable UUID tenant,
                                                         @Valid @RequestBody ProdutoCadastroRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(produtoService.criar(tenant, request));
    }

    @PreAuthorize("@perm.tem(#request.tipo().name() == 'FINAL' ? 'PRODUTOS_FINAIS_ALTERAR' : 'INGREDIENTES_ALTERAR')")
    @PutMapping("/{id}")
    public ProdutoCadastroResponse atualizar(@PathVariable UUID tenant, @PathVariable Long id,
                                             @Valid @RequestBody ProdutoCadastroRequest request) {
        return produtoService.atualizar(tenant, id, request);
    }

    /** Ativa ou inativa o produto sem mexer nos demais dados. */
    @PreAuthorize("@perm.tem('PRODUTOS_FINAIS_INATIVAR', 'INGREDIENTES_INATIVAR')")
    @PutMapping("/{id}/ativo")
    public ResponseEntity<Void> alterarAtivo(@PathVariable UUID tenant, @PathVariable Long id,
                                             @RequestBody AlterarAtivoRequest request) {
        produtoService.alterarAtivo(tenant, id, request.ativo());
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("@perm.tem('PRODUTOS_FINAIS_EXCLUIR', 'INGREDIENTES_EXCLUIR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID tenant, @PathVariable Long id) {
        produtoService.excluir(tenant, id);
        return ResponseEntity.noContent().build();
    }
}
