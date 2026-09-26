package com.cardapio.repository;

import com.cardapio.entity.T_FidelidadeMovimento;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface T_FidelidadeMovimentoRepository extends JpaRepository<T_FidelidadeMovimento, Long> {

    /** Lotes com saldo e ainda válidos, os que vencem primeiro na frente (é por eles que o resgate começa). */
    @Query("select m from T_FidelidadeMovimento m where m.tenant = :tenant and m.idClienteConta = :conta and m.tipo in ('GANHO', 'ESTORNO') "
            + "and m.restante > 0 and (m.expiraEm is null or m.expiraEm > :agora) order by m.expiraEm asc nulls last, m.id asc")
    List<T_FidelidadeMovimento> lotesValidos(@Param("tenant") UUID tenant, @Param("conta") Long conta, @Param("agora") LocalDateTime agora);

    @Query("select m from T_FidelidadeMovimento m where m.tenant = :tenant and m.idClienteConta = :conta order by m.criadoEm desc, m.id desc")
    List<T_FidelidadeMovimento> extrato(@Param("tenant") UUID tenant, @Param("conta") Long conta, Pageable limite);

    boolean existsByIdPedidoAndTipo(Long idPedido, String tipo);
}
