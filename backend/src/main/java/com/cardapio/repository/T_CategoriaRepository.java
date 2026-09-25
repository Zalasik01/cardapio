package com.cardapio.repository;

import com.cardapio.entity.T_Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface T_CategoriaRepository extends JpaRepository<T_Categoria, Long>, JpaSpecificationExecutor<T_Categoria> {
    List<T_Categoria> findByTenantAndAtivoTrueAndDeletadoFalseOrderByOrdemExibicaoAsc(UUID tenant);
    List<T_Categoria> findByTenantAndDeletadoFalseOrderByOrdemExibicaoAsc(UUID tenant);
    Optional<T_Categoria> findByIdAndTenantAndDeletadoFalse(Long id, UUID tenant);

    boolean existsByTenantAndNomeIgnoreCaseAndDeletadoFalse(UUID tenant, String nome);

    boolean existsByTenantAndNomeIgnoreCaseAndDeletadoFalseAndIdNot(UUID tenant, String nome, Long id);
}
