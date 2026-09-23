package com.cardapio.dto.auth;

import com.cardapio.entity.S_Usuario;

import java.util.UUID;

/** Dados do usuario logado. O perfil e o papel (ROLE_*) valido na sessao atual. */
public record UsuarioLogadoResponse(
        Long id,
        UUID guid,
        String nome,
        String email,
        boolean usuarioSuporte,
        String perfil,
        boolean temFoto
) {

    public static UsuarioLogadoResponse of(S_Usuario usuario, String perfil, boolean temFoto) {
        return new UsuarioLogadoResponse(
                usuario.getId(), usuario.getGuid(), usuario.getNome(), usuario.getEmail(), usuario.isUsuarioSuporte(),
                perfil, temFoto);
    }
}
