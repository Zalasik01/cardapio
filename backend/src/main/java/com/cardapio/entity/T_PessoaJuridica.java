package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/** Dados de uma pessoa juridica. Ligada a uma {@link T_Pessoa}. */
@Entity
@Table(name = "t_pessoa_juridica")
@AttributeOverride(name = "id", column = @Column(name = "id_pessoa_juridica"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_PessoaJuridica extends TenantAbstract {

    @Column(nullable = false)
    private String razaoSocial;

    private String nomeFantasia;

    @Column(length = 18)
    private String cnpj;

    @Column(length = 30)
    private String inscricaoEstadual;

    @Column(length = 30)
    private String inscricaoMunicipal;

    @Column(length = 2000)
    private String observacao;
}
