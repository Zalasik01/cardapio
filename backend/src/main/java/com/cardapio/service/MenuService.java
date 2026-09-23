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

    private final S_CategoriaMenuRepository categoriaMenuRepository;
    private final S_PaginaRepository paginaRepository;

    /** Monta o menu: categorias ordenadas, cada uma com suas paginas ordenadas. */
    @Transactional(readOnly = true)
    public List<CategoriaMenuResponse> montarMenu() {
        Map<Long, List<PaginaMenuResponse>> paginasPorCategoria = paginaRepository
                .findByAtivoTrueAndDeletadoFalseOrderByOrdemAsc().stream()
                .collect(Collectors.groupingBy(
                        (S_Pagina pagina) -> pagina.getCategoriaMenu().getId(),
                        Collectors.mapping(PaginaMenuResponse::of, Collectors.toList())));

        return categoriaMenuRepository.findByAtivoTrueAndDeletadoFalseOrderByOrdemAsc().stream()
                .map(categoria -> CategoriaMenuResponse.of(
                        categoria, paginasPorCategoria.getOrDefault(categoria.getId(), List.of())))
                .toList();
    }
}
