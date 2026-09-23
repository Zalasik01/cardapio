package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

/**
 * Taxa fixa de entrega para um bairro/zona. Tem prioridade sobre o calculo
 * por distancia da loja quando ha correspondencia de bairro.
 */
@Entity
@Table(name = "t_zona_entrega")
@AttributeOverride(name = "id", column = @Column(name = "id_zona_entrega"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_ZonaEntrega extends TenantAbstract {

    @Column(nullable = false)
    private String bairro;

    @Column(nullable = false)
    private BigDecimal taxa;

    @Builder.Default
    private Integer tempoEstimadoMinutos = 45;
}
