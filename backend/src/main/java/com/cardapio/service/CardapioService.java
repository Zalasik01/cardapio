package com.cardapio.service;

import com.cardapio.dto.cardapio.CardapioResponse;
import com.cardapio.dto.cardapio.CategoriaRequest;
import com.cardapio.dto.cardapio.CategoriaResponse;
import com.cardapio.dto.cardapio.ProdutoRequest;
import com.cardapio.dto.cardapio.ProdutoResponse;
import com.cardapio.dto.loja.LojaResponse;
import com.cardapio.entity.S_Loja;
import com.cardapio.entity.T_Categoria;
import com.cardapio.entity.T_Produto;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.repository.T_CategoriaRepository;
import com.cardapio.repository.T_ProdutoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CardapioService {

    private final T_CategoriaRepository categoriaRepository;
    private final T_ProdutoRepository produtoRepository;
    private final LojaService lojaService;

    @Transactional(readOnly = true)
    public CardapioResponse buscarCardapioPublico(String slug) {
        S_Loja loja = lojaService.buscarPorSlug(slug);
        UUID tenant = loja.getGuid();

        List<T_Produto> produtos = produtoRepository.findByTenantAndTipoAndAtivoTrueAndDisponivelTrueAndDeletadoFalseOrderByOrdemExibicaoAsc(
                tenant, com.cardapio.entity.TipoProduto.FINAL);
        List<T_Categoria> categorias = categoriaRepository.findByTenantAndAtivoTrueAndDeletadoFalseOrderByOrdemExibicaoAsc(tenant);

        List<CardapioResponse.CategoriaComProdutosResponse> categoriasComProdutos = categorias.stream()
                .map(categoria -> new CardapioResponse.CategoriaComProdutosResponse(
                        categoria.getGuid(),
                        categoria.getNome(),
                        produtos.stream()
                                .filter(p -> p.getCategoria().getId().equals(categoria.getId()))
                                .map(ProdutoResponse::of)
                                .collect(Collectors.toList())))
                .filter(c -> !c.produtos().isEmpty())
                .sorted(Comparator.comparing(CardapioResponse.CategoriaComProdutosResponse::nome))
                .collect(Collectors.toList());

        return new CardapioResponse(LojaResponse.of(loja), categoriasComProdutos);
    }

    @Transactional(readOnly = true)
    public List<T_Categoria> listarCategorias(UUID tenant) {
        return categoriaRepository.findByTenantAndDeletadoFalseOrderByOrdemExibicaoAsc(tenant);
    }

    @Transactional
    public T_Categoria criarCategoria(UUID tenant, CategoriaRequest request) {
        T_Categoria categoria = T_Categoria.builder()
                .tenant(tenant)
                .nome(request.nome())
                .ordemExibicao(request.ordemExibicao() != null ? request.ordemExibicao() : 0)
                .build();

        if (request.ativo() != null) categoria.setAtivo(request.ativo());

        return categoriaRepository.save(categoria);
    }

    @Transactional
    public T_Categoria atualizarCategoria(UUID tenant, UUID categoriaGuid, CategoriaRequest request) {
        T_Categoria categoria = buscarCategoria(tenant, categoriaGuid);
        categoria.setNome(request.nome());
        if (request.ordemExibicao() != null) categoria.setOrdemExibicao(request.ordemExibicao());
        if (request.ativo() != null) categoria.setAtivo(request.ativo());
        return categoriaRepository.save(categoria);
    }

    @Transactional
    public void excluirCategoria(UUID tenant, UUID categoriaGuid) {
        T_Categoria categoria = buscarCategoria(tenant, categoriaGuid);
        categoria.setDeletado(true);
        categoria.setAtivo(false);
        categoriaRepository.save(categoria);
    }

    @Transactional(readOnly = true)
    public List<T_Produto> listarProdutos(UUID tenant) {
        return produtoRepository.findByTenantOrderByOrdemExibicaoAsc(tenant);
    }

    @Transactional
    public T_Produto criarProduto(UUID tenant, ProdutoRequest request) {
        T_Categoria categoria = buscarCategoria(tenant, request.categoriaGuid());

        T_Produto produto = T_Produto.builder()
                .tenant(tenant)
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
    public T_Produto atualizarProduto(UUID tenant, UUID produtoGuid, ProdutoRequest request) {
        T_Produto produto = buscarProduto(tenant, produtoGuid);
        T_Categoria categoria = buscarCategoria(tenant, request.categoriaGuid());

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
    public void excluirProduto(UUID tenant, UUID produtoGuid) {
        T_Produto produto = buscarProduto(tenant, produtoGuid);
        produto.setDeletado(true);
        produto.setAtivo(false);
        produto.setDisponivel(false);
        produtoRepository.save(produto);
    }

    private T_Categoria buscarCategoria(UUID tenant, UUID categoriaGuid) {
        return categoriaRepository.findByGuidAndTenant(categoriaGuid, tenant)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Categoria não encontrada: " + categoriaGuid));
    }

    private T_Produto buscarProduto(UUID tenant, UUID produtoGuid) {
        return produtoRepository.findByGuidAndTenant(produtoGuid, tenant)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Produto não encontrado: " + produtoGuid));
    }
}
