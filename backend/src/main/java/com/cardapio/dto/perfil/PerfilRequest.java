package com.cardapio.dto.perfil;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Edicao do proprio perfil ("Seu perfil"). configuracoes so e gravado quando salvarConfiguracoes e true. */
public record PerfilRequest(
        @NotBlank @Size(max = 255) String nome,
        @Size(max = 20) String whatsapp,
        boolean salvarConfiguracoes,
        @Size(max = 5000) String configuracoes
) {
}
