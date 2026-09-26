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

/** Grupo de opções de um produto (ex.: "Tamanho", "Adicionais", "Ponto da carne"): quantas o cliente deve/pode escolher. */
@Entity
@Table(name = "t_grupo_opcao")
@AttributeOverride(name = "id", column = @Column(name = "id_grupo_opcao"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_GrupoOpcao extends TenantAbstract {

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(length = 200)
    private String descricao;

    /** Mínimo de opções que o cliente precisa escolher (0 = opcional). */
    @Column(nullable = false)
    private int minimo;

    /** Máximo de opções (1 = escolha única). */
    @Column(nullable = false)
    private int maximo;

    @Column(nullable = false)
    private int ordem;

    @jakarta.persistence.OneToMany(mappedBy = "grupo", fetch = FetchType.EAGER, cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    @org.hibernate.annotations.Fetch(org.hibernate.annotations.FetchMode.SUBSELECT)
    @jakarta.persistence.OrderBy("ordem ASC, id ASC")
    @lombok.Builder.Default
    private java.util.List<T_Opcao> opcoes = new java.util.ArrayList<>();
}
