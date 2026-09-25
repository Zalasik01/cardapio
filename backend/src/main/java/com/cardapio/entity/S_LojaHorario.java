package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalTime;

/** Intervalo em que a loja funciona num dia da semana (1 = segunda ... 7 = domingo). */
@Entity
@Table(name = "s_loja_horario")
@AttributeOverride(name = "id", column = @Column(name = "id_loja_horario"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class S_LojaHorario extends SystemAbstract {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_loja", nullable = false)
    private S_Loja loja;

    @Column(nullable = false)
    private short diaSemana;

    @Column(nullable = false)
    private LocalTime abre;

    /** Se for menor ou igual a "abre", o intervalo termina no dia seguinte. */
    @Column(nullable = false)
    private LocalTime fecha;
}
