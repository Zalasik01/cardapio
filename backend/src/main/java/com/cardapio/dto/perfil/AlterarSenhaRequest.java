package com.cardapio.dto.perfil;

import jakarta.validation.constraints.NotBlank;

/** senhaAtual so pode faltar na troca obrigatoria (apos redefinicao por um administrador). */
public record AlterarSenhaRequest(String senhaAtual, @NotBlank String novaSenha) {
}
