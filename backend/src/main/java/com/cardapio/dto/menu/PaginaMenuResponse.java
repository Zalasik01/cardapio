package com.cardapio.dto.menu;

import com.cardapio.entity.S_Pagina;

import java.util.List;
import java.util.UUID;

/** Pagina do menu. screen e o caminho para o cabecalho ("Geral, Pessoas, Usuarios"). rota e nula nas paginas que so agrupam outras; filhas traz o proximo nivel do submenu. */
public record PaginaMenuResponse(
        UUID guid, String nome, String rota, String screen, Integer ordem, List<PaginaMenuResponse> filhas) {

    public static PaginaMenuResponse of(S_Pagina pagina, List<PaginaMenuResponse> filhas) {
        return new PaginaMenuResponse(pagina.getGuid(), pagina.getNome(), pagina.getRota(), pagina.getScreen(), pagina.getOrdem(), filhas);
    }
}
