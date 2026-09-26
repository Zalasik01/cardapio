package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/** Opção escolhida em um item do pedido, com nome e preço do momento da compra. */
@Entity
@Table(name = "i_item_pedido_opcao")
@AttributeOverride(name = "id", column = @Column(name = "id_item_pedido_opcao"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class I_ItemPedidoOpcao extends TenantAbstract {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_item_pedido", nullable = false)
    private I_ItemPedido item;

    private Long idOpcao;

    @Column(nullable = false, length = 100)
    private String nomeGrupo;

    @Column(nullable = false, length = 100)
    private String nomeOpcao;

    @Column(nullable = false)
    private BigDecimal preco;
}
