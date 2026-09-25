package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * Forma de pagamento aceita pela loja. A taxa (percentual e/ou fixa) é o custo dessa forma de pagamento;
 * as regras dizem quando ela pode ser usada (valor mínimo do pedido, entrega e/ou retirada).
 */
@Entity
@Table(name = "t_forma_pagamento")
@AttributeOverride(name = "id", column = @Column(name = "id_forma_pagamento"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_FormaPagamento extends TenantAbstract {

    @Column(nullable = false)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoFormaPagamento tipo;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal taxaPercentual = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal taxaFixa = BigDecimal.ZERO;

    /** Valor mínimo do pedido para usar esta forma; nulo = sem mínimo. */
    private BigDecimal valorMinimo;

    @Column(nullable = false)
    @Builder.Default
    private boolean aceitaEntrega = true;

    @Column(nullable = false)
    @Builder.Default
    private boolean aceitaRetirada = true;

    @Column(nullable = false)
    @Builder.Default
    private Integer ordem = 0;
}
