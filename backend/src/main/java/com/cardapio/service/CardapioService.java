package com.cardapio.service;

import com.cardapio.dto.cardapio.CardapioResponse;
import com.cardapio.dto.cardapio.ProdutoResponse;
import com.cardapio.dto.loja.LojaResponse;
import com.cardapio.entity.S_Loja;
import com.cardapio.entity.T_Categoria;
import com.cardapio.entity.T_Produto;
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
}
