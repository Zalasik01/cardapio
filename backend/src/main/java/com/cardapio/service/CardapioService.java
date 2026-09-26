package com.cardapio.service;

import com.cardapio.dto.cardapio.CardapioResponse;
import com.cardapio.dto.cardapio.ProdutoResponse;
import com.cardapio.dto.loja.LojaResponse;
import com.cardapio.entity.S_Loja;
import com.cardapio.entity.T_Categoria;
import com.cardapio.entity.T_Produto;
import com.cardapio.repository.T_CategoriaRepository;
import com.cardapio.repository.T_FormaPagamentoRepository;
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
    private final FuncionamentoService funcionamentoService;
    private final com.cardapio.repository.T_PedidoRepository pedidoRepository;
    private final AvaliacaoService avaliacaoService;
    private final T_FormaPagamentoRepository formaPagamentoRepository;

    @Transactional(readOnly = true)
    public CardapioResponse buscarCardapioPublico(String slug) {
        S_Loja loja = lojaService.buscarPorSlug(slug);
        UUID tenant = loja.getGuid();
        java.time.LocalDateTime agora = java.time.LocalDateTime.now(java.time.ZoneId.of(loja.getFusoHorario()));

        List<T_Produto> produtos = produtoRepository.findByTenantAndTipoAndAtivoTrueAndDisponivelTrueAndDeletadoFalseOrderByOrdemExibicaoAsc(
                tenant, com.cardapio.entity.TipoProduto.FINAL);
        List<T_Categoria> categorias = categoriaRepository.findByTenantAndAtivoTrueAndDeletadoFalseOrderByOrdemExibicaoAsc(tenant);

        List<CardapioResponse.CategoriaComProdutosResponse> categoriasComProdutos = categorias.stream()
                .map(categoria -> new CardapioResponse.CategoriaComProdutosResponse(
                        categoria.getGuid(),
                        categoria.getNome(),
                        produtos.stream()
                                .filter(p -> p.getCategoria().getId().equals(categoria.getId()))
                                .map(p -> ProdutoResponse.of(p, agora))
                                .collect(Collectors.toList())))
                .filter(c -> !c.produtos().isEmpty())
                .sorted(Comparator.comparing(CardapioResponse.CategoriaComProdutosResponse::nome))
                .collect(Collectors.toList());

        var situacao = funcionamentoService.situacao(tenant);
        var formas = formaPagamentoRepository.findByTenantAndAtivoTrueAndDeletadoFalseOrderByOrdemAscNomeAsc(tenant).stream()
                .map(f -> new CardapioResponse.FormaPagamentoPublica(f.getNome(), f.getTipo().name(), f.getTaxaPercentual(),
                        f.getTaxaFixa(), f.isAceitaEntrega(), f.isAceitaRetirada()))
                .toList();

        // os mais pedidos dos últimos 30 dias (só os que ainda estão no cardápio), calculados pelas vendas
        var noCardapio = produtos.stream().map(T_Produto::getGuid).collect(Collectors.toSet());
        List<UUID> maisVendidos = pedidoRepository.maisVendidos(tenant, agora.minusDays(30), org.springframework.data.domain.PageRequest.of(0, 12))
                .stream().filter(noCardapio::contains).limit(8).toList();

        var resumoAvaliacao = avaliacaoService.resumo(tenant);
        return new CardapioResponse(LojaResponse.of(loja), situacao.aberta(), situacao.motivo(), situacao.pausadoAte(),
                maisVendidos, resumoAvaliacao.total() == 0 ? null : resumoAvaliacao.mediaLoja(), resumoAvaliacao.total(),
                situacao.proximaMudanca(), formas, categoriasComProdutos);
    }

    /** Manifesto do PWA da loja: nome, cores, ícone (logo da loja, se houver) e a página inicial dela. */
    @Transactional(readOnly = true)
    public java.util.Map<String, Object> manifesto(String slug) {
        S_Loja loja = lojaService.buscarPorSlug(slug);
        String inicio = "/" + loja.getSlug();
        String nome = loja.getNome();
        var icones = new java.util.ArrayList<java.util.Map<String, Object>>();
        if (loja.getLogoUrl() != null && !loja.getLogoUrl().isBlank()) {
            icones.add(java.util.Map.of("src", loja.getLogoUrl(), "sizes", "512x512", "purpose", "any"));
        }
        // PNGs em todos os tamanhos exigidos para instalar em qualquer aparelho (o SVG fica como reserva)
        icones.add(java.util.Map.of("src", "/icons/icon-192.png", "sizes", "192x192", "type", "image/png", "purpose", "any"));
        icones.add(java.util.Map.of("src", "/icons/icon-512.png", "sizes", "512x512", "type", "image/png", "purpose", "any"));
        icones.add(java.util.Map.of("src", "/icons/icon-maskable-512.png", "sizes", "512x512", "type", "image/png", "purpose", "maskable"));
        icones.add(java.util.Map.of("src", "/favicon.svg", "sizes", "any", "type", "image/svg+xml", "purpose", "any"));
        var manifesto = new java.util.LinkedHashMap<String, Object>();
        manifesto.put("id", inicio);
        manifesto.put("name", nome);
        manifesto.put("short_name", nome.length() > 12 ? nome.substring(0, 12).trim() : nome);
        manifesto.put("description", "Cardápio e pedidos de " + nome);
        manifesto.put("start_url", inicio);
        manifesto.put("scope", "/");
        manifesto.put("display", "standalone");
        manifesto.put("orientation", "portrait");
        manifesto.put("background_color", "#fbf7f4");
        manifesto.put("theme_color", "#dc2626");
        manifesto.put("icons", icones);
        return manifesto;
    }
}
