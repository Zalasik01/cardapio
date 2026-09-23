package com.cardapio.entity;

import jakarta.persistence.MappedSuperclass;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

/**
 * Superclasse das tabelas que pertencem a uma loja (t_, i_ e, quando ligadas a
 * uma loja, h_). O tenant e o guid da s_loja dona do registro.
 */
@MappedSuperclass
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public abstract class TenantAbstract extends SystemAbstract {

    private UUID tenant;
}
