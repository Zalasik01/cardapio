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

import java.time.LocalDate;

/** Dados de uma pessoa fisica. Ligada a uma {@link T_Pessoa}. O CPF e guardado so com digitos. */
@Entity
@Table(name = "t_pessoa_fisica")
@AttributeOverride(name = "id", column = @Column(name = "id_pessoa_fisica"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_PessoaFisica extends TenantAbstract {

    @Column(nullable = false)
    private String nome;

    private String apelido;

    @Column(length = 14)
    private String cpf;

    @Column(length = 30)
    private String rg;

    @Enumerated(EnumType.STRING)
    private Sexo sexo;

    private LocalDate dataNascimento;

    private String naturalidade;

    private String nacionalidade;

    @Enumerated(EnumType.STRING)
    private EstadoCivil estadoCivil;

    private String profissao;

    @Column(length = 2000)
    private String observacao;
}
