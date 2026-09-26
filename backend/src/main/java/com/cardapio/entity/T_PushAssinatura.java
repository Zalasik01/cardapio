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

/** Um aparelho que aceitou receber notificações push: de nova entrega (entregador) ou de um pedido (cliente). */
@Entity
@Table(name = "t_push_assinatura")
@AttributeOverride(name = "id", column = @Column(name = "id_push_assinatura"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_PushAssinatura extends TenantAbstract {

    /** ENTREGADOR ou PEDIDO. */
    @Column(nullable = false, length = 20)
    private String tipo;

    private Long idEntregador;

    private Long idPedido;

    @Column(nullable = false, length = 1000)
    private String endpoint;

    @Column(name = "chave_p256dh", nullable = false, length = 200)
    private String chaveP256dh;

    @Column(name = "chave_auth", nullable = false, length = 100)
    private String chaveAuth;

    @Column(nullable = false)
    private LocalDateTime criadoEm;
}
