package com.cardapio.entity;

/** Situação registrada de uma mensalidade. "Atrasada" não é gravada: é uma PENDENTE já vencida. */
public enum SituacaoMensalidade {
    PENDENTE,
    PAGA,
    CANCELADA
}
