package com.cardapio.dto.funcionario;

import com.cardapio.entity.TipoTelefone;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TelefoneDto(
        @NotNull TipoTelefone tipo,
        @NotBlank @Size(max = 20) String numero,
        @Size(max = 255) String observacao
) {
}
