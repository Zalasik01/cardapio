package com.cardapio.dto.usuario;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;


/**
 * Cadastro/edicao de usuario da loja. O e-mail so e usado na criacao (nao muda depois);
 * ativo so e considerado na edicao (na criacao o usuario nasce ativo, com acesso PENDENTE).
 */
public record UsuarioLojaRequest(
        @NotBlank @Size(max = 255) String nome,
        @NotBlank @Email @Size(max = 255) String email,
        @NotNull Long funcionarioId,
        Boolean ativo,
        boolean administrador
) {
}
