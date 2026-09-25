package com.cardapio.repository;

import com.cardapio.entity.StatusPedido;
import com.cardapio.entity.T_Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface T_PedidoRepository extends JpaRepository<T_Pedido, Long>, JpaSpecificationExecutor<T_Pedido> {

    /** Pedido com os itens, pelo guid público (acompanhamento do cliente). */
    @Query("select distinct p from T_Pedido p left join fetch p.itens i left join fetch i.produto where p.guid = :guid")
    Optional<T_Pedido> buscarComItensPorGuid(UUID guid);

    /** Pedido com os itens, pelo id, dentro da loja (painel). */
    @Query("select distinct p from T_Pedido p left join fetch p.itens where p.id = :id and p.tenant = :tenant")
    Optional<T_Pedido> buscarComItensPorId(@Param("id") Long id, @Param("tenant") UUID tenant);

    /** Soma das quantidades dos itens de cada pedido: linhas [pedidoId, quantidade]. */
    @Query("select i.pedido.id, sum(i.quantidade) from I_ItemPedido i where i.pedido.id in :ids group by i.pedido.id")
    List<Object[]> somarItensPorPedido(@Param("ids") Collection<Long> ids);

    @Query("select count(p) from T_Pedido p where p.tenant = :tenant and p.dataCriacao >= :de and p.dataCriacao < :ate")
    long contarNoPeriodo(@Param("tenant") UUID tenant, @Param("de") LocalDateTime de, @Param("ate") LocalDateTime ate);

    @Query("select count(p) from T_Pedido p where p.tenant = :tenant and p.dataCriacao >= :de and p.dataCriacao < :ate "
            + "and p.status = :status")
    long contarNoPeriodoPorStatus(@Param("tenant") UUID tenant, @Param("de") LocalDateTime de,
                                  @Param("ate") LocalDateTime ate, @Param("status") StatusPedido status);

    @Query("select coalesce(sum(p.total), 0) from T_Pedido p where p.tenant = :tenant and p.dataCriacao >= :de "
            + "and p.dataCriacao < :ate and p.status = :status")
    BigDecimal somarNoPeriodoPorStatus(@Param("tenant") UUID tenant, @Param("de") LocalDateTime de,
                                       @Param("ate") LocalDateTime ate, @Param("status") StatusPedido status);

    @Query("select count(p) from T_Pedido p where p.tenant = :tenant and p.status in :status")
    long contarPorStatus(@Param("tenant") UUID tenant, @Param("status") Collection<StatusPedido> status);
}
