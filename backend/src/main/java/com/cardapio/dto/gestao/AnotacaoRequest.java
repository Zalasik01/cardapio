package com.cardapio.dto.gestao;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AnotacaoRequest(@NotBlank @Size(max = 4000) String texto) {
}
