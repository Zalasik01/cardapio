package com.cardapio.repository;

import com.cardapio.entity.T_FormaPagamento;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface T_FormaPagamentoRepository
        extends JpaRepository<T_FormaPagamento, Long>, JpaSpecificationExecutor<T_FormaPagamento> {

    Optional<T_FormaPagamento> findByIdAndTenantAndDeletadoFalse(Long id, UUID tenant);

    boolean existsByTenantAndNomeIgnoreCaseAndDeletadoFalse(UUID tenant, String nome);

    boolean existsByTenantAndNomeIgnoreCaseAndDeletadoFalseAndIdNot(UUID tenant, String nome, Long id);

    List<T_FormaPagamento> findByTenantAndAtivoTrueAndDeletadoFalseOrderByOrdemAscNomeAsc(UUID tenant);
}
