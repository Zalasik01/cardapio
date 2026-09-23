package com.cardapio.service;

import com.cardapio.dto.cardapio.CardapioResponse;
import com.cardapio.dto.cardapio.CategoriaRequest;
import com.cardapio.dto.cardapio.CategoriaResponse;
import com.cardapio.dto.cardapio.ProdutoRequest;
import com.cardapio.dto.cardapio.ProdutoResponse;
import com.cardapio.dto.restaurante.RestauranteResponse;
import com.cardapio.entity.Categoria;
import com.cardapio.entity.Produto;
import com.cardapio.entity.Restaurante;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.repository.CategoriaRepository;
import com.cardapio.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CardapioService {

    private final CategoriaRepository categoriaRepository;
    private final ProdutoRepository produtoRepository;
    private final RestauranteService restauranteService;

    @Transactional(readOnly = true)
    public CardapioResponse buscarCardapioPublico(String slug) {
        Restaurante restaurante = restauranteService.buscarPorSlug(slug);

        List<Produto> produtos = produtoRepository.findByRestauranteIdAndDisponivelTrueOrderByOrdemExibicaoAsc(restaurante.getId());
        List<Categoria> categorias = categoriaRepository.findByRestauranteIdAndAtivoTrueOrderByOrdemExibicaoAsc(restaurante.getId());

        List<CardapioResponse.CategoriaComProdutosResponse> categoriasComProdutos = categorias.stream()
                .map(categoria -> new CardapioResponse.CategoriaComProdutosResponse(
                        categoria.getId(),
                        categoria.getNome(),
                        produtos.stream()
                                .filter(p -> p.getCategoria().getId().equals(categoria.getId()))
                                .map(ProdutoResponse::of)
                                .collect(Collectors.toList())))
                .filter(c -> !c.produtos().isEmpty())
                .sorted(Comparator.comparing(CardapioResponse.CategoriaComProdutosResponse::nome))
                .collect(Collectors.toList());

        return new CardapioResponse(RestauranteResponse.of(restaurante), categoriasComProdutos);
    }

    @Transactional(readOnly = true)
    public List<Categoria> listarCategorias(Long restauranteId) {
        return categoriaRepository.findByRestauranteIdOrderByOrdemExibicaoAsc(restauranteId);
    }

    @Transactional
    public Categoria criarCategoria(Long restauranteId, CategoriaRequest request) {
        Restaurante restaurante = restauranteService.buscarPorId(restauranteId);

        Categoria categoria = Categoria.builder()
                .restaurante(restaurante)
                .nome(request.nome())
                .ordemExibicao(request.ordemExibicao() != null ? request.ordemExibicao() : 0)
                .ativo(request.ativo() == null || request.ativo())
                .build();

        return categoriaRepository.save(categoria);
    }

    @Transactional
    public Categoria atualizarCategoria(Long restauranteId, Long categoriaId, CategoriaRequest request) {
        Categoria categoria = buscarCategoria(restauranteId, categoriaId);
        categoria.setNome(request.nome());
        if (request.ordemExibicao() != null) categoria.setOrdemExibicao(request.ordemExibicao());
        if (request.ativo() != null) categoria.setAtivo(request.ativo());
        return categoriaRepository.save(categoria);
    }

    @Transactional
    public void excluirCategoria(Long restauranteId, Long categoriaId) {
        Categoria categoria = buscarCategoria(restauranteId, categoriaId);
        categoriaRepository.delete(categoria);
    }

    @Transactional(readOnly = true)
    public List<Produto> listarProdutos(Long restauranteId) {
        return produtoRepository.findByRestauranteIdOrderByOrdemExibicaoAsc(restauranteId);
    }

    @Transactional
    public Produto criarProduto(Long restauranteId, ProdutoRequest request) {
        Restaurante restaurante = restauranteService.buscarPorId(restauranteId);
        Categoria categoria = buscarCategoria(restauranteId, request.categoriaId());

        Produto produto = Produto.builder()
                .restaurante(restaurante)
                .categoria(categoria)
                .nome(request.nome())
                .descricao(request.descricao())
                .preco(request.preco())
                .imagemUrl(request.imagemUrl())
                .disponivel(request.disponivel() == null || request.disponivel())
                .ordemExibicao(request.ordemExibicao() != null ? request.ordemExibicao() : 0)
                .build();

        return produtoRepository.save(produto);
    }

    @Transactional
    public Produto atualizarProduto(Long restauranteId, Long produtoId, ProdutoRequest request) {
        Produto produto = buscarProduto(restauranteId, produtoId);
        Categoria categoria = buscarCategoria(restauranteId, request.categoriaId());

        produto.setCategoria(categoria);
        produto.setNome(request.nome());
        produto.setDescricao(request.descricao());
        produto.setPreco(request.preco());
        produto.setImagemUrl(request.imagemUrl());
        if (request.disponivel() != null) produto.setDisponivel(request.disponivel());
        if (request.ordemExibicao() != null) produto.setOrdemExibicao(request.ordemExibicao());

        return produtoRepository.save(produto);
    }

    @Transactional
    public void excluirProduto(Long restauranteId, Long produtoId) {
        Produto produto = buscarProduto(restauranteId, produtoId);
        produtoRepository.delete(produto);
    }

    private Categoria buscarCategoria(Long restauranteId, Long categoriaId) {
        Categoria categoria = categoriaRepository.findById(categoriaId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Categoria nao encontrada: " + categoriaId));
        validarPertenceAoRestaurante(categoria.getRestaurante().getId(), restauranteId);
        return categoria;
    }

    private Produto buscarProduto(Long restauranteId, Long produtoId) {
        Produto produto = produtoRepository.findById(produtoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Produto nao encontrado: " + produtoId));
        validarPertenceAoRestaurante(produto.getRestaurante().getId(), restauranteId);
        return produto;
    }

    private void validarPertenceAoRestaurante(Long idDoRecurso, Long restauranteId) {
        if (!idDoRecurso.equals(restauranteId)) {
            throw new RecursoNaoEncontradoException("Recurso nao pertence a este restaurante");
        }
    }
}
