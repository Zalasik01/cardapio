package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

/**
 * Tabela de sistema: cadastro das lojas da plataforma. E a propria "loja"
 * quem define um tenant — o guid desta entidade e usado como tenant nas
 * tabelas t_ (e opcionalmente h_) que pertencem a ela.
 */
@Entity
@Table(name = "s_loja")
@AttributeOverride(name = "id", column = @Column(name = "id_loja"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class S_Loja extends SystemAbstract {

    @Column(nullable = false)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SituacaoConta situacaoConta = SituacaoConta.TRIAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoOrganizacao tipoOrganizacao;

    @Column(nullable = false, unique = true)
    private String slug;

    /** CNPJ da empresa, so digitos (opcional). */
    @Column(length = 18)
    private String cnpj;

    /** Valor padrao da mensalidade cobrada da loja e o dia (1 a 28) em que vence. */
    @Column(nullable = false)
    @Builder.Default
    private BigDecimal valorMensalidade = BigDecimal.ZERO;

    private Integer diaVencimento;

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
}
