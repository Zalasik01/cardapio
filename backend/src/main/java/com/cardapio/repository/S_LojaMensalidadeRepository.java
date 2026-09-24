package com.cardapio.repository;

import com.cardapio.entity.S_LojaMensalidade;
import com.cardapio.entity.SituacaoMensalidade;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface S_LojaMensalidadeRepository extends JpaRepository<S_LojaMensalidade, Long> {

    List<S_LojaMensalidade> findByLojaIdAndDeletadoFalseOrderByCompetenciaDesc(Long lojaId);

    Optional<S_LojaMensalidade> findByIdAndLojaIdAndDeletadoFalse(Long id, Long lojaId);

    boolean existsByLojaIdAndCompetenciaAndDeletadoFalse(Long lojaId, LocalDate competencia);

    boolean existsByLojaIdAndCompetenciaAndDeletadoFalseAndIdNot(Long lojaId, LocalDate competencia, Long id);

    // ---- números da Gestão Interna (dashboard)
    @Query("select coalesce(sum(m.valor), 0) from S_LojaMensalidade m "
            + "where m.deletado = false and m.competencia = :competencia and m.situacao = :situacao")
    BigDecimal somarDaCompetencia(@Param("competencia") LocalDate competencia,
                                  @Param("situacao") SituacaoMensalidade situacao);

    @Query("select count(m) from S_LojaMensalidade m where m.deletado = false "
            + "and m.situacao = com.cardapio.entity.SituacaoMensalidade.PENDENTE and m.dataVencimento < :hoje")
    long contarAtrasadas(@Param("hoje") LocalDate hoje);

    @Query("select coalesce(sum(m.valor), 0) from S_LojaMensalidade m where m.deletado = false "
            + "and m.situacao = com.cardapio.entity.SituacaoMensalidade.PENDENTE and m.dataVencimento < :hoje")
    BigDecimal somarAtrasadas(@Param("hoje") LocalDate hoje);

    @Query("select m from S_LojaMensalidade m join fetch m.loja where m.deletado = false "
            + "and m.situacao = com.cardapio.entity.SituacaoMensalidade.PENDENTE and m.dataVencimento >= :hoje "
            + "order by m.dataVencimento asc")
    List<S_LojaMensalidade> proximosVencimentos(@Param("hoje") LocalDate hoje, Pageable pagina);

    @Query("select m from S_LojaMensalidade m join fetch m.loja where m.deletado = false "
            + "and m.situacao = com.cardapio.entity.SituacaoMensalidade.PENDENTE and m.dataVencimento < :hoje "
            + "order by m.dataVencimento asc")
    List<S_LojaMensalidade> atrasadas(@Param("hoje") LocalDate hoje, Pageable pagina);
}
