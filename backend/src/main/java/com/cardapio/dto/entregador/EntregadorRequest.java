package com.cardapio.dto.entregador;

import com.cardapio.entity.TipoEntregador;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/** Cadastro/edição de entregador. repassePorEntrega vazio = zero. */
public record EntregadorRequest(
        @NotBlank @Size(max = 120) String nome,
        @Size(max = 20) String telefone,
        @NotNull TipoEntregador tipo,
        @Size(max = 60) String veiculo,
        @PositiveOrZero BigDecimal repassePorEntrega,
        Boolean ativo
) {
}
