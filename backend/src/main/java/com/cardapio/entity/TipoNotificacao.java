package com.cardapio.entity;

/** O que gerou a notificação. */
public enum TipoNotificacao {
    /** Chegou um pedido novo feito pelo cliente. */
    NOVO_PEDIDO,
    /** Pedido pendente há tempo demais sem ser confirmado. */
    PEDIDO_AGUARDANDO,
    /** Um pedido foi editado (a cozinha precisa saber). */
    PEDIDO_EDITADO,
    /** O prazo de preparo do pedido passou e ele ainda não saiu da cozinha. */
    PEDIDO_ATRASADO
}
