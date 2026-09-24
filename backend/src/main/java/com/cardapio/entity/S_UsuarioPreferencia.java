package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/** Tabela de sistema: preferência de tela de um usuário (chave + valor em JSON), só dele. */
@Entity
@Table(name = "s_usuario_preferencia")
@AttributeOverride(name = "id", column = @Column(name = "id_usuario_preferencia"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class S_UsuarioPreferencia extends SystemAbstract {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private S_Usuario usuario;

    @Column(nullable = false, length = 80)
    private String chave;

    @Column(nullable = false, columnDefinition = "text")
    private String valor;
}
