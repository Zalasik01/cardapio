package com.cardapio.service;

import com.cardapio.entity.S_Permissao;
import com.cardapio.entity.TipoPermissao;
import com.cardapio.repository.S_PermissaoRepository;
import com.cardapio.security.AppUserDetails;
import com.cardapio.security.Permissoes;
import java.util.HashSet;
import java.util.Set;
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
    private final S_PermissaoRepository permissaoRepository;

    /**
     * Monta o menu: categorias ordenadas; em cada uma, as paginas de primeiro nivel e, dentro
     * delas, as paginas filhas (id_pagina_pai), todas ordenadas por "ordem".
     */
    @Transactional(readOnly = true)
    public List<CategoriaMenuResponse> montarMenu(AppUserDetails usuario) {
        boolean usuarioAdministrador = usuario.getUsuario().isUsuarioAdministrador();
        boolean acessoTotal = usuario.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals(Permissoes.PAPEL_SISTEMA) || a.getAuthority().equals(Permissoes.PAPEL_ADMINISTRADOR_LOJA));
        // paginas que tem permissao de leitura no catalogo so aparecem para quem a possui
        Set<Long> paginasRestritas = new HashSet<>();
        Set<Long> paginasLiberadas = new HashSet<>();
        for (S_Permissao permissao : permissaoRepository.listarCatalogo()) {
            if (permissao.getTipo() != TipoPermissao.LEITURA) {
                continue;
            }
            paginasRestritas.add(permissao.getPagina().getId());
            if (usuario.getPermissoes().contains(permissao.getCodigo())) {
                paginasLiberadas.add(permissao.getPagina().getId());
            }
        }
        List<S_Pagina> paginas = paginaRepository.findByAtivoTrueAndDeletadoFalseOrderByOrdemAsc().stream()
                .filter(pagina -> acessoTotal || !paginasRestritas.contains(pagina.getId()) || paginasLiberadas.contains(pagina.getId()))
                .toList();

        Map<Long, List<S_Pagina>> filhasPorPai = paginas.stream()
                .filter(pagina -> pagina.getPaginaPai() != null)
                .collect(Collectors.groupingBy(pagina -> pagina.getPaginaPai().getId()));
        Map<Long, List<S_Pagina>> raizesPorCategoria = paginas.stream()
                .filter(pagina -> pagina.getPaginaPai() == null)
                .collect(Collectors.groupingBy(pagina -> pagina.getCategoriaMenu().getId()));

        return categoriaMenuRepository.findByAtivoTrueAndDeletadoFalseOrderByOrdemAsc().stream()
                // categorias de gestao interna so existem no menu de quem administra a plataforma
                .filter(categoria -> usuarioAdministrador || !categoria.isSomenteAdministrador())
                .map(categoria -> CategoriaMenuResponse.of(
                        categoria,
                        raizesPorCategoria.getOrDefault(categoria.getId(), List.of()).stream()
                                .map(pagina -> converter(pagina, filhasPorPai, 1))
                                // grupo sem rota cujas telas foram todas escondidas some junto
                                .filter(pagina -> acessoTotal || pagina.rota() != null || !pagina.filhas().isEmpty())
                                .toList()))
                .filter(categoria -> acessoTotal || !categoria.paginas().isEmpty())
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
