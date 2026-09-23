package com.cardapio.dto.menu;

import com.cardapio.entity.S_Pagina;

import java.util.List;
import java.util.UUID;

/** Pagina do menu. rota e nula nas paginas que so agrupam outras; filhas traz o proximo nivel do submenu. */
public record PaginaMenuResponse(UUID guid, String nome, String rota, Integer ordem, List<PaginaMenuResponse> filhas) {

    public static PaginaMenuResponse of(S_Pagina pagina, List<PaginaMenuResponse> filhas) {
        return new PaginaMenuResponse(pagina.getGuid(), pagina.getNome(), pagina.getRota(), pagina.getOrdem(), filhas);
    }
}
