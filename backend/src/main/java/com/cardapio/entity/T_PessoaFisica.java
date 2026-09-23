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

import java.time.LocalDate;

/** Dados de uma pessoa fisica. Ligada a uma {@link T_Pessoa}. */
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

    private LocalDate dataNascimento;

    private String telefone;
}
