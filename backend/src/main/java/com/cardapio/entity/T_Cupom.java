package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/** Cupom de desconto da loja: o cliente digita o código no checkout. As regras são checadas no servidor. */
@Entity
@Table(name = "t_cupom")
@AttributeOverride(name = "id", column = @Column(name = "id_cupom"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_Cupom extends TenantAbstract {

    /** Sempre em maiúsculas, sem espaços. */
    @Column(nullable = false, length = 40)
    private String codigo;

    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoCupom tipo;

    /** Percentual (0–100) ou valor em reais; ignorado no frete grátis. */
    @Column(nullable = false)
    private BigDecimal valor;

    /** Subtotal mínimo dos itens para usar o cupom. */
    private BigDecimal valorMinimo;

    /** Teto do desconto (útil no percentual). */
    private BigDecimal descontoMaximo;

    private LocalDateTime inicio;

    private LocalDateTime fim;

    /** Quantas vezes o cupom pode ser usado no total (vazio = sem limite). */
    private Integer limiteTotal;

    /** Quantas vezes cada cliente pode usar (vazio = sem limite). */
    private Integer limitePorCliente;

    @Column(nullable = false)
    private boolean primeiroPedido;

    /** Só vale para este tipo de pedido (vazio = entrega e retirada). */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private TipoEntrega tipoEntrega;

    /** Desconto só sobre os itens desta categoria (vazio = todos os itens). */
    private Long idCategoria;

    /** Falso = não vale em pedido que tenha produto em promoção. */
    @Column(nullable = false)
    private boolean cumulativo;
}
