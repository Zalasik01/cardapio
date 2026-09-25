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

/**
 * Tabela de sistema: perfis de acesso disponiveis na plataforma.
 * O campo codigo e usado como authority do Spring Security (ex.: ROLE_SISTEMA).
 */
@Entity
@Table(name = "s_perfil")
@AttributeOverride(name = "id", column = @Column(name = "id_perfil"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class S_Perfil extends SystemAbstract {

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, unique = true)
    private String codigo;
}
