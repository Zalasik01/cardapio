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

/**
 * Pessoa da loja: aponta para uma {@link T_PessoaFisica} ou para uma
 * {@link T_PessoaJuridica} (uma das duas, nunca ambas).
 */
@Entity
@Table(name = "t_pessoa")
@AttributeOverride(name = "id", column = @Column(name = "id_pessoa"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_Pessoa extends TenantAbstract {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_pessoa_fisica")
    private T_PessoaFisica pessoaFisica;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_pessoa_juridica")
    private T_PessoaJuridica pessoaJuridica;
}
