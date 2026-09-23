package com.cardapio.dto.usuario;

import com.cardapio.entity.StatusPerfilUsuario;

/** Filtros da tela de busca de usuarios. Campos nulos ou vazios nao filtram. */
public record FiltroUsuario(
        String busca,
        String nome,
        String email,
        Boolean ativo,
        StatusPerfilUsuario status
) {
}
