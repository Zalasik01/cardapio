package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/** Permissão concedida a um usuário numa loja (vínculo {@link T_PerfilUsuario}). */
@Entity
@Table(name = "t_permissao_usuario")
@AttributeOverride(name = "id", column = @Column(name = "id_permissao_usuario"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_PermissaoUsuario extends TenantAbstract {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_perfil_usuario", nullable = false)
    private T_PerfilUsuario perfilUsuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_permissao", nullable = false)
    private S_Permissao permissao;

    @PrePersist
    void definirTenant() {
        if (getTenant() == null && perfilUsuario != null) {
            setTenant(perfilUsuario.getTenant());
        }
    }
}
