package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/** Foto de perfil do usuario, em tabela propria para nao pesar nas consultas de usuario. */
@Entity
@Table(name = "s_usuario_foto")
@AttributeOverride(name = "id", column = @Column(name = "id_usuario_foto"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class S_UsuarioFoto extends SystemAbstract {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false, unique = true)
    private S_Usuario usuario;

    @Column(nullable = false, length = 50)
    private String tipoConteudo;

    @Column(nullable = false, columnDefinition = "bytea")
    private byte[] conteudo;
}
