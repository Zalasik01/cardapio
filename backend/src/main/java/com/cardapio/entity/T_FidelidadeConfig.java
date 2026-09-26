package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/** Programa de fidelidade (cashback) da loja: quanto volta, por quanto tempo vale e como pode ser usado. */
@Entity
@Table(name = "t_fidelidade_config")
@AttributeOverride(name = "id", column = @Column(name = "id_fidelidade_config"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_FidelidadeConfig extends TenantAbstract {

    @Column(nullable = false)
    private boolean programaAtivo;

    /** Percentual do valor dos itens (já com desconto) que volta como cashback. */
    @Column(nullable = false)
    private BigDecimal percentual;

    @Column(nullable = false)
    private int validadeDias;

    /** Saldo mínimo para poder usar o cashback. */
    @Column(nullable = false)
    private BigDecimal resgateMinimo;

    /** Máximo do pedido (percentual dos itens) que pode ser pago com cashback. */
    @Column(name = "resgate_maximo_pct", nullable = false)
    private BigDecimal resgateMaximoPct;
}
