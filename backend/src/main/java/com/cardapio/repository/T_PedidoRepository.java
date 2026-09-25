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
    @Query("select distinct p from T_Pedido p left join fetch p.itens i left join fetch i.produto where p.guid = :guid and p.deletado = false")
    Optional<T_Pedido> buscarComItensPorGuid(UUID guid);

    /** Pedido com os itens, pelo id, dentro da loja (painel). */
    @Query("select distinct p from T_Pedido p left join fetch p.itens where p.id = :id and p.tenant = :tenant and p.deletado = false")
    Optional<T_Pedido> buscarComItensPorId(@Param("id") Long id, @Param("tenant") UUID tenant);

    /** Pedidos do quadro: os em andamento (de qualquer dia) e os encerrados a partir de "desde". */
    @Query("select distinct p from T_Pedido p left join fetch p.itens where p.tenant = :tenant and p.deletado = false "
            + "and (p.status in :abertos or p.dataAtualizacao >= :desde) order by p.dataCriacao")
    List<T_Pedido> buscarParaQuadro(@Param("tenant") UUID tenant, @Param("abertos") Collection<StatusPedido> abertos,
                                    @Param("desde") LocalDateTime desde);

    /** Pedidos não cancelados e não excluídos de um telefone na loja (histórico do cliente). */
    @Query("select count(p) from T_Pedido p where p.tenant = :tenant and p.deletado = false "
            + "and p.telefoneCliente = :telefone and p.status <> com.cardapio.entity.StatusPedido.CANCELADO")
    long contarPedidosDoTelefone(@Param("tenant") UUID tenant, @Param("telefone") String telefone);

    /** Pedidos com a situação dada, criados antes do limite (lembretes de pedido parado). */
    List<T_Pedido> findByStatusAndDeletadoFalseAndDataCriacaoBefore(StatusPedido status, LocalDateTime limite);

    /** Histórico de vários telefones de uma vez (quadro do painel): linhas [telefone, quantidade]. */
    @Query("select p.telefoneCliente, count(p) from T_Pedido p where p.tenant = :tenant and p.deletado = false "
            + "and p.status <> com.cardapio.entity.StatusPedido.CANCELADO and p.telefoneCliente in :telefones "
            + "group by p.telefoneCliente")
    List<Object[]> contarPedidosPorTelefone(@Param("tenant") UUID tenant, @Param("telefones") Collection<String> telefones);

    /** Soma das quantidades dos itens de cada pedido: linhas [pedidoId, quantidade]. */
    @Query("select i.pedido.id, sum(i.quantidade) from I_ItemPedido i where i.pedido.id in :ids group by i.pedido.id")
    List<Object[]> somarItensPorPedido(@Param("ids") Collection<Long> ids);

    @Query("select count(p) from T_Pedido p where p.tenant = :tenant and p.deletado = false and p.dataCriacao >= :de and p.dataCriacao < :ate")
    long contarNoPeriodo(@Param("tenant") UUID tenant, @Param("de") LocalDateTime de, @Param("ate") LocalDateTime ate);

    @Query("select count(p) from T_Pedido p where p.tenant = :tenant and p.deletado = false and p.dataCriacao >= :de and p.dataCriacao < :ate "
            + "and p.status = :status")
    long contarNoPeriodoPorStatus(@Param("tenant") UUID tenant, @Param("de") LocalDateTime de,
                                  @Param("ate") LocalDateTime ate, @Param("status") StatusPedido status);

    @Query("select coalesce(sum(p.total), 0) from T_Pedido p where p.tenant = :tenant and p.deletado = false and p.dataCriacao >= :de "
            + "and p.dataCriacao < :ate and p.status = :status")
    BigDecimal somarNoPeriodoPorStatus(@Param("tenant") UUID tenant, @Param("de") LocalDateTime de,
                                       @Param("ate") LocalDateTime ate, @Param("status") StatusPedido status);

    @Query("select count(p) from T_Pedido p where p.tenant = :tenant and p.deletado = false and p.status in :status")
    long contarPorStatus(@Param("tenant") UUID tenant, @Param("status") Collection<StatusPedido> status);
}
