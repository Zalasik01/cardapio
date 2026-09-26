package com.cardapio.dto.categoria;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/** Cadastro/edição de categoria do cardápio. A ordem define a posição dela no cardápio (menor aparece primeiro). */
public record CategoriaCadastroRequest(
        @NotBlank @Size(max = 255) String nome,
        @PositiveOrZero Integer ordemExibicao,
        @jakarta.validation.constraints.Positive Integer tempoPreparoMinutos,
        Boolean ativo
) {
}
