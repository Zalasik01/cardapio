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

/** Avaliação de um pedido entregue: nota da loja (1–5), nota da entrega (1–5, só pedidos de entrega), comentário e resposta. */
@Entity
@Table(name = "t_avaliacao")
@AttributeOverride(name = "id", column = @Column(name = "id_avaliacao"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_Avaliacao extends TenantAbstract {

    @Column(nullable = false, unique = true)
    private Long idPedido;

    private Long idClienteConta;

    @Column(nullable = false)
    private Short notaLoja;

    private Short notaEntrega;

    @Column(length = 500)
    private String comentario;

    @Column(nullable = false)
    private LocalDateTime criadoEm;

    @Column(length = 500)
    private String resposta;

    private LocalDateTime respondidaEm;
}
