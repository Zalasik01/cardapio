package com.cardapio.repository;

import com.cardapio.entity.S_Loja;
import com.cardapio.entity.SituacaoConta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface S_LojaRepository extends JpaRepository<S_Loja, Long>, JpaSpecificationExecutor<S_Loja> {
    Optional<S_Loja> findBySlug(String slug);
    Optional<S_Loja> findByGuid(UUID guid);
    boolean existsBySlug(String slug);
    boolean existsByCnpjAndDeletadoFalse(String cnpj);
    boolean existsByCnpjAndDeletadoFalseAndIdNot(String cnpj, Long id);
    List<S_Loja> findByAtivoTrueAndDeletadoFalseOrderByNomeAsc();
    List<S_Loja> findByAtivoTrueAndDeletadoFalseAndNomeContainingIgnoreCaseOrderByNomeAsc(String nome);

    // ---- números da Gestão Interna (dashboard)
    long countByDeletadoFalse();

    long countByDeletadoFalseAndAtivoTrue();

    @Query("select l.situacaoConta, count(l) from S_Loja l where l.deletado = false group by l.situacaoConta")
    List<Object[]> contarPorSituacao();

    @Query("select l.tipoOrganizacao, count(l) from S_Loja l where l.deletado = false group by l.tipoOrganizacao")
    List<Object[]> contarPorTipo();

    @Query("select coalesce(sum(l.valorMensalidade), 0) from S_Loja l "
            + "where l.deletado = false and l.ativo = true and l.situacaoConta = :situacao")
    BigDecimal somarMensalidadePadrao(@Param("situacao") SituacaoConta situacao);

    @Query("select count(l) from S_Loja l where l.deletado = false and l.ativo = true and l.situacaoConta in :situacoes "
            + "and not exists (select 1 from S_LojaMensalidade m where m.loja = l and m.deletado = false "
            + "and m.competencia = :competencia)")
    long contarSemMensalidadeNaCompetencia(@Param("situacoes") Collection<SituacaoConta> situacoes,
                                           @Param("competencia") LocalDate competencia);
}
