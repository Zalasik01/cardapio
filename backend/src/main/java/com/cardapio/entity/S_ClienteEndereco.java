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

/** Endereço salvo na conta do cliente (vale para todas as lojas). */
@Entity
@Table(name = "s_cliente_endereco")
@AttributeOverride(name = "id", column = @Column(name = "id_cliente_endereco"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class S_ClienteEndereco extends SystemAbstract {

    @Column(nullable = false)
    private Long idClienteConta;

    @Column(nullable = false, length = 40)
    private String apelido;

    private String cep;

    @Column(nullable = false)
    private String rua;

    @Column(nullable = false, length = 20)
    private String numero;

    private String complemento;

    @Column(nullable = false)
    private String bairro;

    private String cidade;

    private Double latitude;

    private Double longitude;

    @Column(nullable = false)
    private LocalDateTime criadoEm;
}
