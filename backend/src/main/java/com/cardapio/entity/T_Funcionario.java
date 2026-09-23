package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;

/**
 * Funcionario da loja. Os dados pessoais ficam na {@link T_Pessoa} (pessoa fisica,
 * endereco e contatos); aqui ficam so os dados de trabalho.
 */
@Entity
@Table(name = "t_funcionario")
@AttributeOverride(name = "id", column = @Column(name = "id_funcionario"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_Funcionario extends TenantAbstract {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_pessoa", nullable = false, unique = true)
    private T_Pessoa pessoa;

    @Column(length = 20)
    private String numeroCnh;

    private LocalDate vencimentoCnh;
}
