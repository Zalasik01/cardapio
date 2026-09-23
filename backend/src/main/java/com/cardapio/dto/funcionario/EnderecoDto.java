package com.cardapio.dto.funcionario;

import jakarta.validation.constraints.Size;

public record EnderecoDto(
        @Size(max = 9) String cep,
        @Size(max = 255) String logradouro,
        @Size(max = 20) String numero,
        @Size(max = 255) String complemento,
        @Size(max = 255) String bairro,
        @Size(max = 255) String cidade,
        @Size(max = 2) String estado
) {
}
