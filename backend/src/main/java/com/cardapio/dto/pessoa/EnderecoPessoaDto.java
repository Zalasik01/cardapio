package com.cardapio.dto.pessoa;

import jakarta.validation.constraints.Size;

/** Um endereço de cliente/fornecedor. O principal é o que aparece no cadastro e no lançamento de pedidos. */
public record EnderecoPessoaDto(
        @Size(max = 40) String apelido,
        boolean principal,
        @Size(max = 9) String cep,
        @Size(max = 255) String logradouro,
        @Size(max = 20) String numero,
        @Size(max = 255) String complemento,
        @Size(max = 255) String bairro,
        @Size(max = 255) String cidade,
        @Size(max = 2) String estado
) {
}
