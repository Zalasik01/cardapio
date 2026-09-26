package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * Entregador da loja. O token é o segredo do link que ele abre no celular (página do entregador, sem login);
 * quem tem o link enxerga só as entregas dele. A última posição vem do GPS do celular durante a rota.
 */
@Entity
@Table(name = "t_entregador")
@AttributeOverride(name = "id", column = @Column(name = "id_entregador"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_Entregador extends TenantAbstract {

    @Column(nullable = false)
    private String nome;

    private String telefone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoEntregador tipo;

    private String veiculo;

    /** Quanto o entregador recebe por entrega (o valor é copiado para o pedido ao atribuir). */
    @Column(nullable = false)
    private BigDecimal repassePorEntrega = BigDecimal.ZERO;

    @Column(nullable = false, unique = true)
    private UUID token;

    private Double ultimaLatitude;

    private Double ultimaLongitude;

    private LocalDateTime posicaoEm;
}
