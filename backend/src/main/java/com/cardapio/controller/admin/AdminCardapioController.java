package com.cardapio.controller.admin;

import com.cardapio.dto.cardapio.CategoriaRequest;
import com.cardapio.dto.cardapio.CategoriaResponse;
import com.cardapio.dto.cardapio.ProdutoRequest;
import com.cardapio.dto.cardapio.ProdutoResponse;
import com.cardapio.service.CardapioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/lojas/{tenant}")
@RequiredArgsConstructor
public class AdminCardapioController {

    private final CardapioService cardapioService;

    @GetMapping("/categorias")
    public List<CategoriaResponse> listarCategorias(@PathVariable UUID tenant) {
        return cardapioService.listarCategorias(tenant).stream().map(CategoriaResponse::of).toList();
    }

    @PostMapping("/categorias")
    public ResponseEntity<CategoriaResponse> criarCategoria(@PathVariable UUID tenant,
                                                              @Valid @RequestBody CategoriaRequest request) {
        var categoria = cardapioService.criarCategoria(tenant, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(CategoriaResponse.of(categoria));
    }

    @PutMapping("/categorias/{categoriaGuid}")
    public CategoriaResponse atualizarCategoria(@PathVariable UUID tenant, @PathVariable UUID categoriaGuid,
                                                 @Valid @RequestBody CategoriaRequest request) {
        return CategoriaResponse.of(cardapioService.atualizarCategoria(tenant, categoriaGuid, request));
    }

    @DeleteMapping("/categorias/{categoriaGuid}")
    public ResponseEntity<Void> excluirCategoria(@PathVariable UUID tenant, @PathVariable UUID categoriaGuid) {
        cardapioService.excluirCategoria(tenant, categoriaGuid);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/produtos")
    public List<ProdutoResponse> listarProdutos(@PathVariable UUID tenant) {
        return cardapioService.listarProdutos(tenant).stream().map(ProdutoResponse::of).toList();
    }

    @PostMapping("/produtos")
    public ResponseEntity<ProdutoResponse> criarProduto(@PathVariable UUID tenant,
                                                          @Valid @RequestBody ProdutoRequest request) {
        var produto = cardapioService.criarProduto(tenant, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ProdutoResponse.of(produto));
    }

    @PutMapping("/produtos/{produtoGuid}")
    public ProdutoResponse atualizarProduto(@PathVariable UUID tenant, @PathVariable UUID produtoGuid,
                                             @Valid @RequestBody ProdutoRequest request) {
        return ProdutoResponse.of(cardapioService.atualizarProduto(tenant, produtoGuid, request));
    }

    @DeleteMapping("/produtos/{produtoGuid}")
    public ResponseEntity<Void> excluirProduto(@PathVariable UUID tenant, @PathVariable UUID produtoGuid) {
        cardapioService.excluirProduto(tenant, produtoGuid);
        return ResponseEntity.noContent().build();
    }
}
