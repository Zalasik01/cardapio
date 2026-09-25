package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * Uma situação (coluna do kanban) do fluxo de pedidos da loja. A categoria diz ao sistema o que ela significa
 * (novo, confirmado, em preparo, em entrega, concluído, cancelado), mesmo que a loja dê outro nome.
 */
@Entity
@Table(name = "t_situacao_pedido")
@AttributeOverride(name = "id", column = @Column(name = "id_situacao_pedido"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_SituacaoPedido extends TenantAbstract {

    @Column(nullable = false)
    private String nome;

    /** Cor em hexadecimal (#RRGGBB). */
    @Column(nullable = false)
    private String cor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusPedido categoria;

    @Column(nullable = false)
    private Integer ordem = 0;
}
