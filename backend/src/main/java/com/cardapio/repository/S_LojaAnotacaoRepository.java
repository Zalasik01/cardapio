package com.cardapio.repository;

import com.cardapio.entity.S_LojaAnotacao;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface S_LojaAnotacaoRepository extends JpaRepository<S_LojaAnotacao, Long> {

    @EntityGraph(attributePaths = {"usuario"})
    List<S_LojaAnotacao> findByLojaIdAndDeletadoFalseOrderByDataCriacaoDesc(Long lojaId);

    @EntityGraph(attributePaths = {"usuario"})
    Optional<S_LojaAnotacao> findByIdAndLojaIdAndDeletadoFalse(Long id, Long lojaId);
}
