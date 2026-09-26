package com.cardapio.entity;

public enum TipoCupom {
    /** Percentual sobre os itens elegíveis (com teto opcional em desconto_maximo). */
    PERCENTUAL,
    /** Valor fixo sobre os itens. */
    VALOR,
    /** Zera a taxa de entrega. */
    FRETE_GRATIS
}
