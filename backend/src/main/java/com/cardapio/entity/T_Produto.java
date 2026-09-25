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
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(name = "t_produto")
@AttributeOverride(name = "id", column = @Column(name = "id_produto"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_Produto extends TenantAbstract {

    /** FINAL (vendido no cardápio) ou INGREDIENTE (insumo). Os produtos que já existiam são finais. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TipoProduto tipo = TipoProduto.FINAL;

    /** Só o produto final tem categoria do cardápio; o ingrediente não. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_categoria")
    private T_Categoria categoria;

    /** Código interno da loja (opcional, único por loja). */
    @Column(length = 50)
    private String codigo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UnidadeMedida unidadeMedida = UnidadeMedida.UN;

    /** Custo por unidade de medida (ingrediente). No produto final o custo vem da composição. */
    @Column(nullable = false, precision = 38, scale = 4)
    @Builder.Default
    private BigDecimal custoUnitario = BigDecimal.ZERO;

    /** Fornecedor do ingrediente (uma pessoa cadastrada como fornecedor), opcional. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_fornecedor")
    private T_Pessoa fornecedor;

    @Column(length = 2000)
    private String observacao;

    @Column(nullable = false)
    private String nome;

    @Column(length = 1000)
    private String descricao;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal preco = BigDecimal.ZERO;

    private String imagemUrl;

    @Column(nullable = false)
    @Builder.Default
    private boolean disponivel = true;

    @Builder.Default
    private Integer ordemExibicao = 0;
}
