package com.cardapio.repository;

import com.cardapio.entity.T_Entregador;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface T_EntregadorRepository extends JpaRepository<T_Entregador, Long>, JpaSpecificationExecutor<T_Entregador> {

    Optional<T_Entregador> findByIdAndTenantAndDeletadoFalse(Long id, UUID tenant);

    Optional<T_Entregador> findByTokenAndDeletadoFalse(UUID token);

    List<T_Entregador> findByTenantAndAtivoTrueAndDeletadoFalseOrderByNomeAsc(UUID tenant);

    List<T_Entregador> findByTenantAndIdIn(UUID tenant, Collection<Long> ids);
}
