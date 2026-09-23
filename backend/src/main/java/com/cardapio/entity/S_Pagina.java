package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

/**
 * Tabela de sistema: paginas do painel administrativo, exibidas como submenu de uma
 * {@link S_CategoriaMenu}. Uma pagina pode ter uma pagina pai, formando niveis de submenu
 * (ex.: Geral > Pessoas > Funcionarios).
 */
@Entity
@Table(name = "s_pagina")
@AttributeOverride(name = "id", column = @Column(name = "id_pagina"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class S_Pagina extends SystemAbstract {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_categoria_menu", nullable = false)
    private S_CategoriaMenu categoriaMenu;

    /** Pagina "anterior" no menu; nula para paginas no primeiro nivel da categoria. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_pagina_pai")
    private S_Pagina paginaPai;

    @Column(nullable = false)
    private String nome;

    /** Rota do frontend que a pagina abre, ex.: "/admin/produtos". Nula quando a pagina so agrupa outras. */
    private String rota;

    /** Posicao da pagina entre as irmas (mesma categoria e mesma pagina pai). */
    @Column(nullable = false)
    @Builder.Default
    private Integer ordem = 0;
}
