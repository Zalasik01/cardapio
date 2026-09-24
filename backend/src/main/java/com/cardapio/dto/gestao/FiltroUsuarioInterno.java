package com.cardapio.dto.gestao;

/** Filtros da tela de busca de usuários internos. Campos nulos ou vazios não filtram. */
public record FiltroUsuarioInterno(
        String busca,
        Boolean administrador,
        boolean mostrarInativos
) {
}
