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

/**
 * Catálogo de permissões do sistema. Cada página do menu tem "visualizar" (LEITURA), "editar" (ESCRITA,
 * que inclui todas as ações) e as ações específicas (ex.: "Cadastrar cliente e fornecedor").
 * O código (ex.: USUARIOS_INCLUIR) é o que os endpoints conferem.
 */
@Entity
@Table(name = "s_permissao")
@AttributeOverride(name = "id", column = @Column(name = "id_permissao"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class S_Permissao extends SystemAbstract {

    @Column(nullable = false, unique = true)
    private String codigo;

    @Column(nullable = false)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoPermissao tipo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_pagina", nullable = false)
    private S_Pagina pagina;

    @Column(nullable = false)
    @Builder.Default
    private Integer ordem = 0;
}
