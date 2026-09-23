package com.cardapio.dto.perfil;

import jakarta.validation.constraints.NotBlank;

public record AlterarSenhaRequest(@NotBlank String senhaAtual, @NotBlank String novaSenha) {
}
