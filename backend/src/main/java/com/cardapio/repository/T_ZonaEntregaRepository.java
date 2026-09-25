package com.cardapio.repository;

import com.cardapio.entity.T_ZonaEntrega;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface T_ZonaEntregaRepository extends JpaRepository<T_ZonaEntrega, Long>, JpaSpecificationExecutor<T_ZonaEntrega> {
    List<T_ZonaEntrega> findByTenantOrderByBairroAsc(UUID tenant);
    Optional<T_ZonaEntrega> findByTenantAndBairroIgnoreCaseAndAtivoTrue(UUID tenant, String bairro);
    Optional<T_ZonaEntrega> findByIdAndTenantAndDeletadoFalse(Long id, UUID tenant);

    boolean existsByTenantAndBairroIgnoreCaseAndDeletadoFalse(UUID tenant, String bairro);

    boolean existsByTenantAndBairroIgnoreCaseAndDeletadoFalseAndIdNot(UUID tenant, String bairro, Long id);
}
