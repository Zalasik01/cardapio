package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

/**
 * Tabela de sistema: usuarios da plataforma (credenciais de acesso). Nao
 * pertence a nenhuma loja: o vinculo usuario-loja fica em {@link T_PerfilUsuario},
 * e um usuario pode ter varios. Usuario de suporte sem nenhum perfil vinculado
 * e usuario do sistema e enxerga todas as lojas.
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

    @Column(nullable = false)
    @lombok.Builder.Default
    private boolean usuarioSuporte = false;

    @Column(nullable = false)
    @lombok.Builder.Default
    private boolean exigeTrocarSenha = false;

    private String esqueciSenhaToken;

    @Column(columnDefinition = "timestamp(0)")
    private LocalDateTime esqueciSenhaExpiraEm;

    @Column(nullable = false, updatable = false, columnDefinition = "timestamp(0)")
    private LocalDateTime dataCriacao;

    @Column(columnDefinition = "timestamp(0)")
    private LocalDateTime dataUltimoAcesso;

    @jakarta.persistence.PrePersist
    void aoCriar() {
        this.dataCriacao = LocalDateTime.now().withNano(0);
    }
}
