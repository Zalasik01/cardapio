package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/** Um uso de cupom: base dos limites (total e por cliente) e da regra de primeiro pedido. */
@Entity
@Table(name = "t_cupom_uso")
@AttributeOverride(name = "id", column = @Column(name = "id_cupom_uso"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_CupomUso extends TenantAbstract {

    @Column(nullable = false)
    private Long idCupom;

    @Column(nullable = false)
    private Long idPedido;

    private Long idClienteConta;

    @Column(nullable = false)
    private BigDecimal valorDesconto;

    @Column(nullable = false)
    private LocalDateTime dataUso;
}
