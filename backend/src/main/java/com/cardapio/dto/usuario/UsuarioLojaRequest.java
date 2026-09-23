package com.cardapio.dto.usuario;

import com.cardapio.entity.StatusPerfilUsuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Cadastro/edicao de usuario da loja. O e-mail so e usado na criacao (nao muda depois);
 * ativo e status so sao considerados na edicao.
 */
public record UsuarioLojaRequest(
        @NotBlank @Size(max = 255) String nome,
        @NotBlank @Email @Size(max = 255) String email,
        Boolean ativo,
        StatusPerfilUsuario status
) {
}
