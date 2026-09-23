package com.cardapio.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Taxa fixa de entrega para um bairro/zona. Tem prioridade sobre o calculo
 * por distancia do restaurante quando ha correspondencia de bairro.
 */
@Entity
@Table(name = "zonas_entrega")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ZonaEntrega {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "restaurante_id", nullable = false)
    private Restaurante restaurante;

    @Column(nullable = false)
    private String bairro;

    @Column(nullable = false)
    private BigDecimal taxa;

    @Builder.Default
    private Integer tempoEstimadoMinutos = 45;

    @Column(nullable = false)
    @Builder.Default
    private boolean ativo = true;
}
