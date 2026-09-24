package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

/** Tabela de sistema: anotação interna da equipe da plataforma sobre uma {@link S_Loja}. */
@Entity
@Table(name = "s_loja_anotacao")
@AttributeOverride(name = "id", column = @Column(name = "id_loja_anotacao"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class S_LojaAnotacao extends SystemAbstract {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_loja", nullable = false)
    private S_Loja loja;

    /** Quem escreveu a anotação. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private S_Usuario usuario;

    @Column(nullable = false, length = 4000)
    private String texto;

    @Column(nullable = false, updatable = false, columnDefinition = "timestamp(0)")
    private LocalDateTime dataCriacao;

    @Column(columnDefinition = "timestamp(0)")
    private LocalDateTime dataAlteracao;

    @PrePersist
    void aoCriar() {
        this.dataCriacao = LocalDateTime.now().withNano(0);
    }
}
