package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.Instant;

/**
 * Tabela de sistema: usuarios da plataforma. E de nivel sistema (s_) mas
 * carrega o campo tenant (herdado de SystemAbstract) para indicar a qual
 * s_loja o usuario administra; nulo para super admins e clientes sem loja
 * vinculada.
 */
@Entity
@Table(name = "s_usuario", uniqueConstraints = @UniqueConstraint(columnNames = "email"))
@AttributeOverride(name = "id", column = @Column(name = "id_usuario"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class S_Usuario extends SystemAbstract {

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false)
    private String email;

    /** Hash SHA-256 da senha. */
    @Column(nullable = false)
    private String senha;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_perfil", nullable = false)
    private S_Perfil perfil;

    @Column(nullable = false)
    @lombok.Builder.Default
    private boolean usuarioSuporte = false;

    @Column(nullable = false)
    @lombok.Builder.Default
    private boolean exigeTrocarSenha = false;

    private String esqueciSenhaToken;

    @Column(nullable = false, updatable = false)
    private Instant dataCriacao;

    private Instant dataUltimoAcesso;

    @jakarta.persistence.PrePersist
    void aoCriar() {
        this.dataCriacao = Instant.now();
    }
}
