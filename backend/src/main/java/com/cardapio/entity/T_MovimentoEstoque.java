package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/** Movimento do estoque de um ingrediente. quantidade é com sinal (entrada positiva, baixa/perda negativa). */
@Entity
@Table(name = "t_movimento_estoque")
@AttributeOverride(name = "id", column = @Column(name = "id_movimento_estoque"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_MovimentoEstoque extends TenantAbstract {

    public static final String ENTRADA = "ENTRADA";
    public static final String BAIXA = "BAIXA";
    public static final String PERDA = "PERDA";
    public static final String AJUSTE = "AJUSTE";
    public static final String ESTORNO = "ESTORNO";

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_ingrediente", nullable = false)
    private T_Produto ingrediente;

    @Column(nullable = false, length = 20)
    private String tipo;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal quantidade;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal saldoApos;

    @Column(length = 200)
    private String motivo;

    private Long idPedido;

    @Column(nullable = false)
    private LocalDateTime dataHora;
}
