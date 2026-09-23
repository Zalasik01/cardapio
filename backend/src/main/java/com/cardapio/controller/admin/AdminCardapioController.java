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

@RestController
@RequestMapping("/api/admin/restaurantes/{restauranteId}")
@RequiredArgsConstructor
public class AdminCardapioController {

    private final CardapioService cardapioService;

    @GetMapping("/categorias")
    public List<CategoriaResponse> listarCategorias(@PathVariable Long restauranteId) {
        return cardapioService.listarCategorias(restauranteId).stream().map(CategoriaResponse::of).toList();
    }

    @PostMapping("/categorias")
    public ResponseEntity<CategoriaResponse> criarCategoria(@PathVariable Long restauranteId,
                                                              @Valid @RequestBody CategoriaRequest request) {
        var categoria = cardapioService.criarCategoria(restauranteId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(CategoriaResponse.of(categoria));
    }

    @PutMapping("/categorias/{categoriaId}")
    public CategoriaResponse atualizarCategoria(@PathVariable Long restauranteId, @PathVariable Long categoriaId,
                                                 @Valid @RequestBody CategoriaRequest request) {
        return CategoriaResponse.of(cardapioService.atualizarCategoria(restauranteId, categoriaId, request));
    }

    @DeleteMapping("/categorias/{categoriaId}")
    public ResponseEntity<Void> excluirCategoria(@PathVariable Long restauranteId, @PathVariable Long categoriaId) {
        cardapioService.excluirCategoria(restauranteId, categoriaId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/produtos")
    public List<ProdutoResponse> listarProdutos(@PathVariable Long restauranteId) {
        return cardapioService.listarProdutos(restauranteId).stream().map(ProdutoResponse::of).toList();
    }

    @PostMapping("/produtos")
    public ResponseEntity<ProdutoResponse> criarProduto(@PathVariable Long restauranteId,
                                                          @Valid @RequestBody ProdutoRequest request) {
        var produto = cardapioService.criarProduto(restauranteId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ProdutoResponse.of(produto));
    }

    @PutMapping("/produtos/{produtoId}")
    public ProdutoResponse atualizarProduto(@PathVariable Long restauranteId, @PathVariable Long produtoId,
                                             @Valid @RequestBody ProdutoRequest request) {
        return ProdutoResponse.of(cardapioService.atualizarProduto(restauranteId, produtoId, request));
    }

    @DeleteMapping("/produtos/{produtoId}")
    public ResponseEntity<Void> excluirProduto(@PathVariable Long restauranteId, @PathVariable Long produtoId) {
        cardapioService.excluirProduto(restauranteId, produtoId);
        return ResponseEntity.noContent().build();
    }
}
