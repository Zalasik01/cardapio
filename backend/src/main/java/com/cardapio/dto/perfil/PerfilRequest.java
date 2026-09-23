package com.cardapio.dto.perfil;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Edicao do proprio perfil ("Seu perfil"). */
public record PerfilRequest(
        @NotBlank @Size(max = 255) String nome,
        @Size(max = 20) String whatsapp
) {
}
