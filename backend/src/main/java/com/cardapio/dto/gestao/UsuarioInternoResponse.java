package com.cardapio.dto.gestao;

import com.cardapio.entity.S_Usuario;

import java.time.LocalDateTime;

/** Usuário interno da plataforma (equipe que atende as lojas). "pendente" = ainda não definiu a senha. */
public record UsuarioInternoResponse(
        Long id,
        String nome,
        String email,
        boolean ativo,
        boolean administrador,
        boolean pendente,
        LocalDateTime dataUltimoAcesso
) {

    public static UsuarioInternoResponse of(S_Usuario usuario) {
        return new UsuarioInternoResponse(
                usuario.getId(), usuario.getNome(), usuario.getEmail(), usuario.isAtivo(),
                usuario.isUsuarioAdministrador(), usuario.isExigeTrocarSenha(), usuario.getDataUltimoAcesso());
    }
}
