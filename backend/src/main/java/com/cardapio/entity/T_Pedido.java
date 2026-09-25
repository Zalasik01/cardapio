package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "t_pedido")
@AttributeOverride(name = "id", column = @Column(name = "id_pedido"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_Pedido extends TenantAbstract {

    /** Nulo quando o pedido e feito como convidado (guest checkout). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cliente")
    private S_Usuario cliente;

    @Column(nullable = false)
    private String nomeCliente;

    @Column(nullable = false)
    private String telefoneCliente;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoEntrega tipoEntrega;

    private String enderecoRua;
    private String enderecoNumero;
    private String enderecoComplemento;
    private String enderecoBairro;
    private String enderecoCidade;
    private Double latitude;
    private Double longitude;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<I_ItemPedido> itens = new ArrayList<>();

    @Column(nullable = false)
    private BigDecimal subtotal;

    @Column(nullable = false)
    private BigDecimal taxaEntrega;

    @Column(nullable = false)
    private BigDecimal total;

    /** Desconto dado pela loja: tipo PERCENTUAL ou VALOR, o valor informado e o desconto já calculado em reais. */
    private String descontoTipo;

    private BigDecimal descontoValor;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal desconto = BigDecimal.ZERO;

    /** Preenchidos ao cancelar: por que foi cancelado e a taxa de cancelamento cobrada (0 = sem taxa). */
    private String motivoCancelamento;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal taxaCancelamento = BigDecimal.ZERO;

    /** Situação atual no fluxo da loja (a categoria dela é o "status"). */
    private Long idSituacao;

    /** Marca de pedido editado depois de criado (o que mudou fica em T_PedidoAlteracao). */
    @Column(nullable = false)
    @Builder.Default
    private boolean editado = false;

    @Column(columnDefinition = "timestamp(0)")
    private LocalDateTime dataEdicao;

    private String formaPagamento;
    private String observacoes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatusPedido status = StatusPedido.PENDENTE;

    @Column(nullable = false, updatable = false, columnDefinition = "timestamp(0)")
    private LocalDateTime dataCriacao;

    @Column(columnDefinition = "timestamp(0)")
    private LocalDateTime dataAtualizacao;

    @PrePersist
    void aoCriar() {
        this.dataCriacao = LocalDateTime.now().withNano(0);
        this.dataAtualizacao = this.dataCriacao;
    }

    @PreUpdate
    void aoAtualizar() {
        this.dataAtualizacao = LocalDateTime.now().withNano(0);
    }
}
