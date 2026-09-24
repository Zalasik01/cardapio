package com.cardapio.dto.gestao;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Mensalidades pagas dentro de um período (pela data do pagamento). */
public record RecebimentosResponse(LocalDate inicio, LocalDate fim, BigDecimal total, long quantidade) {
}
