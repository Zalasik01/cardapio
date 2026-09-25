package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/** Uma edição do pedido: quem editou, quando e o que mudou (uma descrição por linha). */
@Entity
@Table(name = "t_pedido_alteracao")
@AttributeOverride(name = "id", column = @Column(name = "id_pedido_alteracao"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_PedidoAlteracao extends TenantAbstract {

    @Column(name = "id_pedido", nullable = false)
    private Long idPedido;

    private String usuarioNome;

    /** Descrições do que mudou, separadas por quebra de linha. */
    @Column(nullable = false, columnDefinition = "text")
    private String descricoes;

    @Column(nullable = false, updatable = false, columnDefinition = "timestamp(0)")
    private LocalDateTime dataCriacao;

    @PrePersist
    void aoCriar() {
        this.dataCriacao = LocalDateTime.now().withNano(0);
    }
}
