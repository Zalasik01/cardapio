package com.cardapio.repository;

import com.cardapio.entity.T_GrupoOpcao;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface T_GrupoOpcaoRepository extends JpaRepository<T_GrupoOpcao, Long>, JpaSpecificationExecutor<T_GrupoOpcao> {

    Optional<T_GrupoOpcao> findByIdAndTenantAndDeletadoFalse(Long id, UUID tenant);

    List<T_GrupoOpcao> findByTenantAndDeletadoFalseAndAtivoTrueOrderByNomeAsc(UUID tenant);

    List<T_GrupoOpcao> findByIdInAndTenantAndDeletadoFalse(Collection<Long> ids, UUID tenant);

    boolean existsByTenantAndNomeIgnoreCaseAndDeletadoFalse(UUID tenant, String nome);

    boolean existsByTenantAndNomeIgnoreCaseAndDeletadoFalseAndIdNot(UUID tenant, String nome, Long id);
}
