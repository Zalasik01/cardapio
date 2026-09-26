package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/** Personalização do site (cardápio online) da loja. */
@Entity
@Table(name = "t_loja_site")
@AttributeOverride(name = "id", column = @Column(name = "id_loja_site"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_LojaSite extends TenantAbstract {

    /** Cor da marca em hexadecimal (#RRGGBB); vazio = a cor padrão do cardápio. */
    @Column(length = 7)
    private String corPrimaria;

    private String bannerUrl;

    @Column(length = 1000)
    private String sobre;

    private String instagram;

    private String facebook;

    private String whatsapp;

    /** Aviso em destaque no topo do cardápio (ex.: "Frete grátis hoje!"). */
    @Column(length = 160)
    private String mensagemTopo;

    /** Domínio próprio (ex.: pedidos.minhaloja.com.br), apontado para o sistema. */
    private String dominio;
}
