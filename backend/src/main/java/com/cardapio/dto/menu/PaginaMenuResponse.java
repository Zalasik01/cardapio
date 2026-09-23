package com.cardapio.dto.menu;

import com.cardapio.entity.S_Pagina;

import java.util.UUID;

public record PaginaMenuResponse(UUID guid, String nome, String rota, Integer ordem) {

    public static PaginaMenuResponse of(S_Pagina pagina) {
        return new PaginaMenuResponse(pagina.getGuid(), pagina.getNome(), pagina.getRota(), pagina.getOrdem());
    }
}
