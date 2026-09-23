package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * Vinculo de um usuario com uma loja: quem e a pessoa naquela loja
 * ({@link T_Pessoa}) e com qual papel ({@link S_Perfil}). Um usuario pode ter
 * um perfil em varias lojas. O tenant do registro e sempre o guid da loja.
 */
@Entity
@Table(name = "t_perfil_usuario", uniqueConstraints = @UniqueConstraint(columnNames = {"id_usuario", "id_loja"}))
@AttributeOverride(name = "id", column = @Column(name = "id_perfil_usuario"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_PerfilUsuario extends TenantAbstract {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private S_Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_pessoa", nullable = false)
    private T_Pessoa pessoa;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_loja", nullable = false)
    private S_Loja loja;

    /** Papel do usuario nesta loja (ex.: ROLE_ADMIN_LOJA). */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_perfil", nullable = false)
    private S_Perfil perfil;

    /** Novos usuarios entram como PENDENTE ate definirem a senha. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatusPerfilUsuario status = StatusPerfilUsuario.PENDENTE;

    @PrePersist
    void definirTenant() {
        if (getTenant() == null && loja != null) {
            setTenant(loja.getGuid());
        }
    }
}
