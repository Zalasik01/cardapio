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

/** Tabela de ligacao entre t_pedido e t_produto, com os dados do item no momento da compra. */
@Entity
@Table(name = "i_item_pedido")
@AttributeOverride(name = "id", column = @Column(name = "id_item_pedido"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class I_ItemPedido extends TenantAbstract {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_pedido", nullable = false)
    private T_Pedido pedido;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_produto", nullable = false)
    private T_Produto produto;

    @Column(nullable = false)
    private String nomeProduto;

    @Column(nullable = false)
    private BigDecimal precoUnitario;

    @Column(nullable = false)
    private Integer quantidade;

    @Column(nullable = false)
    private BigDecimal totalItem;

    private String observacoes;

    /** Adicionais e variações escolhidos (o preço unitário já os inclui). */
    @jakarta.persistence.OneToMany(mappedBy = "item", fetch = jakarta.persistence.FetchType.EAGER, cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    @org.hibernate.annotations.Fetch(org.hibernate.annotations.FetchMode.SUBSELECT)
    @lombok.Builder.Default
    private java.util.List<I_ItemPedidoOpcao> opcoes = new java.util.ArrayList<>();

    /** "Bacon, Queijo extra" (vazio sem opções): para telas e impressões que mostram o item em uma linha. */
    public String resumoOpcoes() {
        return opcoes.stream().map(I_ItemPedidoOpcao::getNomeOpcao).collect(java.util.stream.Collectors.joining(", "));
    }
}
