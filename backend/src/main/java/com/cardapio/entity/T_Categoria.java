package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "t_categoria")
@AttributeOverride(name = "id", column = @Column(name = "id_categoria"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_Categoria extends TenantAbstract {

    @Column(nullable = false)
    private String nome;

    @Builder.Default
    private Integer ordemExibicao = 0;

    /** Tempo de preparo em minutos dos produtos da categoria (vazio = usa o padrão da loja). */
    private Integer tempoPreparoMinutos;
}
