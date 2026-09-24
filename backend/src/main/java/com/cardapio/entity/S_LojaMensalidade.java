package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Tabela de sistema: mensalidade cobrada de uma loja pela plataforma (uma por loja e competência). */
@Entity
@Table(name = "s_loja_mensalidade")
@AttributeOverride(name = "id", column = @Column(name = "id_loja_mensalidade"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class S_LojaMensalidade extends SystemAbstract {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_loja", nullable = false)
    private S_Loja loja;

    /** Primeiro dia do mês a que a mensalidade se refere. */
    @Column(nullable = false)
    private LocalDate competencia;

    @Column(nullable = false)
    private BigDecimal valor;

    @Column(nullable = false)
    private LocalDate dataVencimento;

    private LocalDate dataPagamento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SituacaoMensalidade situacao;

    @Column(length = 2000)
    private String observacao;
}
