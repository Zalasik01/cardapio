package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/** Conta do cliente final: identificada pelo telefone (confirmado por código OTP), valendo para todas as lojas. */
@Entity
@Table(name = "s_cliente_conta")
@AttributeOverride(name = "id", column = @Column(name = "id_cliente_conta"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class S_ClienteConta extends SystemAbstract {

    /** Só dígitos, com DDD (ex.: 47999998888). */
    @Column(nullable = false, unique = true, length = 20)
    private String telefone;

    private String nome;

    @Column(nullable = false)
    private LocalDateTime dataCriacao;

    private LocalDateTime ultimoAcesso;
}
