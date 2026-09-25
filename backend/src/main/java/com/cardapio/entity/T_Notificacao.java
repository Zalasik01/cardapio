package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/** Aviso para a equipe da loja (aparece no sino do painel). rota é a tela que o clique abre. */
@Entity
@Table(name = "t_notificacao")
@AttributeOverride(name = "id", column = @Column(name = "id_notificacao"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_Notificacao extends TenantAbstract {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoNotificacao tipo;

    @Column(nullable = false)
    private String titulo;

    private String mensagem;

    private String rota;

    private Long idPedido;

    @Column(nullable = false, updatable = false, columnDefinition = "timestamp(0)")
    private LocalDateTime dataCriacao;

    @PrePersist
    void aoCriar() {
        this.dataCriacao = LocalDateTime.now().withNano(0);
    }
}
