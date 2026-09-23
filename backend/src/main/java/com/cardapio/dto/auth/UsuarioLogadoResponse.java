package com.cardapio.dto.auth;

import com.cardapio.entity.S_Usuario;

/** Dados do usuario logado. O perfil e o papel (ROLE_*) valido na sessao atual. */
public record UsuarioLogadoResponse(
        Long id,
        String nome,
        String email,
        boolean usuarioSuporte,
        String perfil,
        boolean temFoto
) {

    public static UsuarioLogadoResponse of(S_Usuario usuario, String perfil, boolean temFoto) {
        return new UsuarioLogadoResponse(
                usuario.getId(), usuario.getNome(), usuario.getEmail(), usuario.isUsuarioSuporte(),
                perfil, temFoto);
    }
}
