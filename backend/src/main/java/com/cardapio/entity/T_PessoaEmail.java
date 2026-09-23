package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/** E-mail de contato de uma {@link T_Pessoa} (nao e o e-mail de login do usuario). */
@Entity
@Table(name = "t_pessoa_email")
@AttributeOverride(name = "id", column = @Column(name = "id_pessoa_email"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_PessoaEmail extends TenantAbstract {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_pessoa", nullable = false)
    private T_Pessoa pessoa;

    @Column(nullable = false)
    private String email;

    private String observacao;
}
