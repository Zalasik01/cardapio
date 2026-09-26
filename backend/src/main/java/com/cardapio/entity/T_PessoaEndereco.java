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

/** Endereço de uma {@link T_Pessoa}: pode ter vários (um é o principal). */
@Entity
@Table(name = "t_pessoa_endereco")
@AttributeOverride(name = "id", column = @Column(name = "id_pessoa_endereco"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_PessoaEndereco extends TenantAbstract {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_pessoa", nullable = false)
    private T_Pessoa pessoa;

    /** "Casa", "Trabalho"... (opcional). */
    @Column(length = 40)
    private String apelido;

    /** Um por pessoa: o endereço que vale quando só um é usado (cadastro, pedido). */
    @Column(nullable = false)
    private boolean principal;

    @Column(length = 9)
    private String cep;

    private String logradouro;

    @Column(length = 20)
    private String numero;

    private String complemento;

    private String bairro;

    private String cidade;

    @Column(length = 2)
    private String estado;
}
