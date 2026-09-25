package com.cardapio.entity;

/** O que gerou a notificação. */
public enum TipoNotificacao {
    /** Chegou um pedido novo feito pelo cliente. */
    NOVO_PEDIDO,
    /** Pedido pendente há tempo demais sem ser confirmado. */
    PEDIDO_AGUARDANDO
}
