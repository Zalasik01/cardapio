package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(name = "t_produto")
@AttributeOverride(name = "id", column = @Column(name = "id_produto"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_Produto extends TenantAbstract {

    /** FINAL (vendido no cardápio) ou INGREDIENTE (insumo). Os produtos que já existiam são finais. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TipoProduto tipo = TipoProduto.FINAL;

    /** Só o produto final tem categoria do cardápio; o ingrediente não. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_categoria")
    private T_Categoria categoria;

    /** Código interno da loja (opcional, único por loja). */
    @Column(length = 50)
    private String codigo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UnidadeMedida unidadeMedida = UnidadeMedida.UN;

    /** Custo por unidade de medida (ingrediente). No produto final o custo vem da composição. */
    @Column(nullable = false, precision = 38, scale = 4)
    @Builder.Default
    private BigDecimal custoUnitario = BigDecimal.ZERO;

    /** Fornecedor do ingrediente (uma pessoa cadastrada como fornecedor), opcional. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_fornecedor")
    private T_Pessoa fornecedor;

    @Column(length = 2000)
    private String observacao;

    @Column(nullable = false)
    private String nome;

    @Column(length = 1000)
    private String descricao;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal preco = BigDecimal.ZERO;

    private String imagemUrl;

    @Column(nullable = false)
    @Builder.Default
    private boolean disponivel = true;

    @Builder.Default
    private Integer ordemExibicao = 0;

    /** Tempo de preparo em minutos (vazio = usa o da categoria ou o padrão da loja). */
    private Integer tempoPreparoMinutos;

    /** Preço promocional: quando preenchido (e menor que o preço), é o que o cliente paga. */
    @Column(precision = 12, scale = 2)
    private BigDecimal precoPromocional;

    /** Aparece no bloco de destaques do cardápio online. */
    @Column(nullable = false)
    @Builder.Default
    private boolean destaque = false;

    /** "Acabou hoje": indisponível até esta data/hora (o sistema volta sozinho). */
    private java.time.LocalDateTime esgotadoAte;

    /** Dias da semana (1 = segunda ... 7 = domingo, separados por vírgula) em que o produto é vendido; vazio = todos. */
    private String disponivelDias;

    /** Janela de horário em que o produto é vendido (ex.: almoço 11:00–15:00); vazio = o dia todo. */
    private java.time.LocalTime disponivelDas;

    private java.time.LocalTime disponivelAte;

    /** Selos separados por vírgula: VEGANO, VEGETARIANO, SEM_GLUTEN, SEM_LACTOSE, PICANTE. */
    private String selos;

    /** Texto livre com alérgenos (ex.: "Contém glúten e leite"). */
    private String alergenos;

    /** Promoção só em certos dias/horários (happy hour). Vazio = a promoção vale sempre que houver preço promocional. */
    private String promoDias;

    private java.time.LocalTime promoInicio;

    private java.time.LocalTime promoFim;

    /** Estamos dentro da janela (dias + horário)? Janela que passa da meia-noite (22:00–02:00) é aceita. */
    private static boolean dentroDaJanela(String dias, java.time.LocalTime de, java.time.LocalTime ate, java.time.LocalDateTime agora) {
        java.time.LocalTime hora = agora.toLocalTime();
        boolean viraNoite = de != null && ate != null && ate.isBefore(de);
        // no trecho depois da meia-noite, o dia que vale é o anterior
        int dia = (viraNoite && hora.isBefore(ate) ? agora.minusDays(1) : agora).getDayOfWeek().getValue();
        if (dias != null && !dias.isBlank()) {
            boolean achou = false;
            for (String d : dias.split(",")) {
                if (d.trim().equals(String.valueOf(dia))) achou = true;
            }
            if (!achou) return false;
        }
        if (de == null || ate == null) return true;
        return viraNoite ? (!hora.isBefore(de) || hora.isBefore(ate)) : (!hora.isBefore(de) && hora.isBefore(ate));
    }

    public boolean esgotado(java.time.LocalDateTime agora) {
        return esgotadoAte != null && agora.isBefore(esgotadoAte);
    }

    /** Fora do dia/horário em que o produto é vendido. */
    public boolean foraDoHorario(java.time.LocalDateTime agora) {
        return !dentroDaJanela(disponivelDias, disponivelDas, disponivelAte, agora);
    }

    /** Pode ser pedido agora: ativo, disponível, não esgotado e dentro do horário. */
    public boolean vendavelAgora(java.time.LocalDateTime agora) {
        return isAtivo() && disponivel && !esgotado(agora) && !foraDoHorario(agora);
    }

    public boolean emPromocao(java.time.LocalDateTime agora) {
        return precoPromocional != null && precoPromocional.signum() > 0 && precoPromocional.compareTo(preco) < 0
                && dentroDaJanela(promoDias, promoInicio, promoFim, agora);
    }

    public BigDecimal precoVenda(java.time.LocalDateTime agora) {
        return emPromocao(agora) ? precoPromocional : preco;
    }

    /** Sem a hora da loja em mãos, vale a hora do servidor. */
    public boolean emPromocao() {
        return emPromocao(java.time.LocalDateTime.now());
    }

    public BigDecimal precoVenda() {
        return precoVenda(java.time.LocalDateTime.now());
    }
}
