package com.cardapio.repository;

import com.cardapio.entity.S_LojaMensalidade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface S_LojaMensalidadeRepository extends JpaRepository<S_LojaMensalidade, Long> {

    List<S_LojaMensalidade> findByLojaIdAndDeletadoFalseOrderByCompetenciaDesc(Long lojaId);

    Optional<S_LojaMensalidade> findByIdAndLojaIdAndDeletadoFalse(Long id, Long lojaId);

    boolean existsByLojaIdAndCompetenciaAndDeletadoFalse(Long lojaId, LocalDate competencia);

    boolean existsByLojaIdAndCompetenciaAndDeletadoFalseAndIdNot(Long lojaId, LocalDate competencia, Long id);
}
