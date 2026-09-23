package com.cardapio.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "restaurantes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Restaurante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, unique = true)
    private String slug;

    private String descricao;
    private String telefone;
    private String logoUrl;

    private String enderecoRua;
    private String enderecoNumero;
    private String enderecoBairro;
    private String enderecoCidade;
    private String enderecoEstado;
    private String enderecoCep;

    private Double latitude;
    private Double longitude;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal taxaEntregaBase = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal taxaEntregaPorKm = BigDecimal.ZERO;

    @Builder.Default
    private Double distanciaMaximaEntregaKm = 15.0;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal valorMinimoPedido = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private boolean ativo = true;

    @Column(nullable = false, updatable = false)
    private Instant criadoEm;

    @PrePersist
    void aoCriar() {
        this.criadoEm = Instant.now();
    }
}
