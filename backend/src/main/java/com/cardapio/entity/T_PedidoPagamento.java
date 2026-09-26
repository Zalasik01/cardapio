package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * Um pagamento do pedido (o pedido pode ter vários). valor é a parte do pedido paga nesta forma, taxa é o custo dessa
 * forma (já somado ao total do pedido) e valorRecebido, no dinheiro, é o que o cliente entregou (para calcular o troco).
 */
@Entity
@Table(name = "t_pedido_pagamento")
@AttributeOverride(name = "id", column = @Column(name = "id_pedido_pagamento"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_PedidoPagamento extends TenantAbstract {

    @Column(name = "id_pedido", nullable = false)
    private Long idPedido;

    @Column(name = "id_forma_pagamento")
    private Long idFormaPagamento;

    @Column(nullable = false)
    private String formaNome;

    @Enumerated(EnumType.STRING)
    private TipoFormaPagamento tipo;

    @Column(nullable = false)
    private BigDecimal valor;

    @Column(nullable = false)
    private BigDecimal taxa = BigDecimal.ZERO;

    private BigDecimal valorRecebido;
}
