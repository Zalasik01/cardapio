package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * Tabela de sistema: categorias principais do menu do painel administrativo.
 * As paginas (submenu) de cada categoria ficam em {@link S_Pagina}.
 */
@Entity
@Table(name = "s_categoria_menu")
@AttributeOverride(name = "id", column = @Column(name = "id_categoria_menu"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class S_CategoriaMenu extends SystemAbstract {

    @Column(nullable = false)
    private String nome;

    /** Classes do Font Awesome, ex.: "fa-solid fa-utensils". */
    @Column(nullable = false)
    private String icone;

    /** Posicao da categoria dentro do menu. */
    @Column(nullable = false)
    @Builder.Default
    private Integer ordem = 0;

    /** Categoria exibida (e liberada na API) somente para o usuario administrador da plataforma. */
    @Column(nullable = false)
    @Builder.Default
    private boolean somenteAdministrador = false;
}
