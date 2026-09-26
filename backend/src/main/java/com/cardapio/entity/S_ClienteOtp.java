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

/** Código de acesso enviado ao telefone do cliente (guarda o hash, nunca o código). */
@Entity
@Table(name = "s_cliente_otp")
@AttributeOverride(name = "id", column = @Column(name = "id_cliente_otp"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class S_ClienteOtp extends SystemAbstract {

    @Column(nullable = false, length = 20)
    private String telefone;

    @Column(nullable = false, length = 64)
    private String codigoHash;

    @Column(nullable = false)
    private LocalDateTime expiraEm;

    @Column(nullable = false)
    private int tentativas;

    @Column(nullable = false)
    private boolean usado;

    @Column(nullable = false)
    private LocalDateTime dataCriacao;
}
