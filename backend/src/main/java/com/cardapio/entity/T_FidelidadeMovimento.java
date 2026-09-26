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

/** Extrato do cashback. GANHO é um lote (valor, restante e validade); RESGATE e ESTORNO registram o uso. */
@Entity
@Table(name = "t_fidelidade_movimento")
@AttributeOverride(name = "id", column = @Column(name = "id_fidelidade_movimento"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_FidelidadeMovimento extends TenantAbstract {

    @Column(nullable = false)
    private Long idClienteConta;

    /** GANHO, RESGATE ou ESTORNO. */
    @Column(nullable = false, length = 12)
    private String tipo;

    @Column(nullable = false)
    private BigDecimal valor;

    /** Só nos lotes (GANHO/ESTORNO com validade): quanto ainda pode ser usado. */
    @Column(nullable = false)
    private BigDecimal restante;

    private LocalDateTime expiraEm;

    private Long idPedido;

    @Column(nullable = false)
    private LocalDateTime criadoEm;
}
