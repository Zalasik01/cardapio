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

/** Uma opção de um grupo (ex.: "Bacon", preço adicional R$ 3,00). */
@Entity
@Table(name = "t_opcao")
@AttributeOverride(name = "id", column = @Column(name = "id_opcao"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_Opcao extends TenantAbstract {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_grupo_opcao", nullable = false)
    private T_GrupoOpcao grupo;

    @Column(nullable = false, length = 100)
    private String nome;

    /** Quanto soma ao preço do item (0 = sem custo). */
    @Column(nullable = false)
    private BigDecimal preco;

    /** Falso = "acabou": continua no cadastro, mas o cliente não pode escolher. */
    @Column(nullable = false)
    private boolean disponivel;

    @Column(nullable = false)
    private int ordem;
}
