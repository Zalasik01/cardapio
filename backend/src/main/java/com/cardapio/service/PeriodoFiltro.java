package com.cardapio.service;

import com.cardapio.exception.RegraNegocioException;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/** Regra padrão de todo filtro de período: início e fim (inclusive) e no máximo 90 dias. */
public final class PeriodoFiltro {

    public static final int MAXIMO_DIAS = 90;

    private PeriodoFiltro() {
    }

    public static void validar(LocalDate inicio, LocalDate fim) {
        if (inicio == null || fim == null) {
            throw new RegraNegocioException("Informe o início e o fim do período");
        }
        if (fim.isBefore(inicio)) {
            throw new RegraNegocioException("O fim do período não pode ser antes do início");
        }
        if (ChronoUnit.DAYS.between(inicio, fim) + 1 > MAXIMO_DIAS) {
            throw new RegraNegocioException("O período deve ter no máximo " + MAXIMO_DIAS + " dias");
        }
    }
}
