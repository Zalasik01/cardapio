package com.cardapio.repository;

import com.cardapio.entity.T_Cupom;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface T_CupomRepository extends JpaRepository<T_Cupom, Long>, JpaSpecificationExecutor<T_Cupom> {

    Optional<T_Cupom> findByIdAndTenantAndDeletadoFalse(Long id, UUID tenant);

    Optional<T_Cupom> findByTenantAndCodigoIgnoreCaseAndDeletadoFalse(UUID tenant, String codigo);

    boolean existsByTenantAndCodigoIgnoreCaseAndDeletadoFalse(UUID tenant, String codigo);

    boolean existsByTenantAndCodigoIgnoreCaseAndDeletadoFalseAndIdNot(UUID tenant, String codigo, Long id);
}
