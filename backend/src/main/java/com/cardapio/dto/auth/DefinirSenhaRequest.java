package com.cardapio.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record DefinirSenhaRequest(@NotBlank String senha) {
}
