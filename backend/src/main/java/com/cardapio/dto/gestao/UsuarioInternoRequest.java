package com.cardapio.dto.gestao;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Cadastro/edição de usuário interno. O e-mail só é usado no cadastro; depois muda por "Alterar e-mail". */
public record UsuarioInternoRequest(
        @NotBlank @Size(max = 255) String nome,
        @NotBlank @Email @Size(max = 255) String email,
        boolean administrador,
        Boolean ativo
) {
}
