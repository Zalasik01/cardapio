package com.cardapio.entity;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

/**
 * Superclasse de todas as entidades do sistema.
 *
 * Convencao de nomenclatura das tabelas:
 *   t_ tabelas de tenant (pertencem exclusivamente a uma loja)
 *   h_ tabelas hibridas (podem pertencer a uma loja ou ao sistema)
 *   i_ tabelas de ligacao entre outras tabelas
 *   s_ tabelas de sistema (nivel plataforma)
 *
 * O identificador tecnico (id_&lt;tabela&gt;) e definido em cada subclasse via
 * @AttributeOverride, mas os demais campos de controle sao sempre os mesmos:
 * guid (identificador publico), ativo e deletado (soft delete).
 *
 * O campo tenant (guid da s_loja "dona" do registro) NAO faz parte desta classe:
 * so as tabelas de tenant o possuem, via {@link TenantAbstract}. Tabelas s_ nao
 * tem tenant.
 */
@MappedSuperclass
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public abstract class SystemAbstract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, updatable = false)
    private UUID guid;

    @Column(nullable = false)
    @Builder.Default
    private boolean ativo = true;

    @Column(nullable = false)
    @Builder.Default
    private boolean deletado = false;

    @PrePersist
    protected void gerarGuid() {
        if (guid == null) {
            guid = UUID.randomUUID();
        }
    }
}
