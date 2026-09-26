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

/** Um ponto do trajeto do entregador com o pedido em rota (o cliente vê o caminho percorrido no acompanhamento). */
@Entity
@Table(name = "t_pedido_trilha")
@AttributeOverride(name = "id", column = @Column(name = "id_pedido_trilha"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_PedidoTrilha extends TenantAbstract {

    @Column(nullable = false)
    private Long idPedido;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false)
    private LocalDateTime registradoEm;
}
