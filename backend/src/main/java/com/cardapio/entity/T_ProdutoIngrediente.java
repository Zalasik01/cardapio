package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

/** Item da composição (ficha técnica) de um produto final: quanto de um ingrediente ele leva. */
@Entity
@Table(name = "t_produto_ingrediente")
@AttributeOverride(name = "id", column = @Column(name = "id_produto_ingrediente"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_ProdutoIngrediente extends TenantAbstract {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_produto", nullable = false)
    private T_Produto produto;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_ingrediente", nullable = false)
    private T_Produto ingrediente;

    /** Na unidade de medida do ingrediente. */
    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal quantidade;
}
