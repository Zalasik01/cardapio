package com.cardapio.service;

import com.cardapio.dto.menu.CategoriaMenuResponse;
import com.cardapio.dto.menu.PaginaMenuResponse;
import com.cardapio.entity.S_Pagina;
import com.cardapio.repository.S_CategoriaMenuRepository;
import com.cardapio.repository.S_PaginaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MenuService {

    /** Limite de niveis de submenu; protege contra ciclos de pagina pai cadastrados por engano. */
    private static final int NIVEL_MAXIMO = 5;

    private final S_CategoriaMenuRepository categoriaMenuRepository;
    private final S_PaginaRepository paginaRepository;

    /**
     * Monta o menu: categorias ordenadas; em cada uma, as paginas de primeiro nivel e, dentro
     * delas, as paginas filhas (id_pagina_pai), todas ordenadas por "ordem".
     */
    @Transactional(readOnly = true)
    public List<CategoriaMenuResponse> montarMenu() {
        List<S_Pagina> paginas = paginaRepository.findByAtivoTrueAndDeletadoFalseOrderByOrdemAsc();

        Map<Long, List<S_Pagina>> filhasPorPai = paginas.stream()
                .filter(pagina -> pagina.getPaginaPai() != null)
                .collect(Collectors.groupingBy(pagina -> pagina.getPaginaPai().getId()));
        Map<Long, List<S_Pagina>> raizesPorCategoria = paginas.stream()
                .filter(pagina -> pagina.getPaginaPai() == null)
                .collect(Collectors.groupingBy(pagina -> pagina.getCategoriaMenu().getId()));

        return categoriaMenuRepository.findByAtivoTrueAndDeletadoFalseOrderByOrdemAsc().stream()
                .map(categoria -> CategoriaMenuResponse.of(
                        categoria,
                        raizesPorCategoria.getOrDefault(categoria.getId(), List.of()).stream()
                                .map(pagina -> converter(pagina, filhasPorPai, 1))
                                .toList()))
                .toList();
    }

    private PaginaMenuResponse converter(S_Pagina pagina, Map<Long, List<S_Pagina>> filhasPorPai, int nivel) {
        List<PaginaMenuResponse> filhas = nivel >= NIVEL_MAXIMO
                ? List.of()
                : filhasPorPai.getOrDefault(pagina.getId(), List.of()).stream()
                        .map(filha -> converter(filha, filhasPorPai, nivel + 1))
                        .toList();
        return PaginaMenuResponse.of(pagina, filhas);
    }
}
