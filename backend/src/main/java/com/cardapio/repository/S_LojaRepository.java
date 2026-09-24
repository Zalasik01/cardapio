package com.cardapio.repository;

import com.cardapio.entity.S_Loja;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface S_LojaRepository extends JpaRepository<S_Loja, Long>, JpaSpecificationExecutor<S_Loja> {
    Optional<S_Loja> findBySlug(String slug);
    Optional<S_Loja> findByGuid(UUID guid);
    boolean existsBySlug(String slug);
    List<S_Loja> findByAtivoTrueAndDeletadoFalseOrderByNomeAsc();
    List<S_Loja> findByAtivoTrueAndDeletadoFalseAndNomeContainingIgnoreCaseOrderByNomeAsc(String nome);
}
