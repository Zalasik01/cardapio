package com.cardapio.dto.menu;

import com.cardapio.entity.S_CategoriaMenu;

import java.util.List;
import java.util.UUID;

public record CategoriaMenuResponse(
        UUID guid,
        String nome,
        String icone,
        Integer ordem,
        List<PaginaMenuResponse> paginas
) {

    public static CategoriaMenuResponse of(S_CategoriaMenu categoria, List<PaginaMenuResponse> paginas) {
        return new CategoriaMenuResponse(
                categoria.getGuid(), categoria.getNome(), categoria.getIcone(), categoria.getOrdem(), paginas);
    }
}
