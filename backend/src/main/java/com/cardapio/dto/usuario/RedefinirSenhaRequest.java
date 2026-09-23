package com.cardapio.dto.usuario;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Senha temporaria definida por um administrador; o usuario sera obrigado a troca-la no proximo acesso. */
public record RedefinirSenhaRequest(@NotBlank @Size(max = 72) String senhaTemporaria) {
}
