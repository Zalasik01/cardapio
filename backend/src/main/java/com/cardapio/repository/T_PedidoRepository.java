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

    /** Pedidos em andamento por situação: linhas [idSituacao, quantidade]. */
    @Query("select p.idSituacao, count(p) from T_Pedido p where p.tenant = :tenant and p.deletado = false "
            + "and p.status in :abertos and p.idSituacao is not null group by p.idSituacao")
    List<Object[]> contarAbertosPorSituacao(@Param("tenant") UUID tenant, @Param("abertos") Collection<StatusPedido> abertos);

    /** A situação mudou de categoria: os pedidos nela acompanham. */
    @org.springframework.data.jpa.repository.Modifying
    @Query("update T_Pedido p set p.status = :categoria where p.idSituacao = :situacao")
    void sincronizarCategoria(@Param("situacao") Long situacao, @Param("categoria") StatusPedido categoria);

    /** Liga todos os pedidos da loja que estão numa categoria à situação dada (criação/restauração do fluxo padrão). */
    @org.springframework.data.jpa.repository.Modifying
    @Query("update T_Pedido p set p.idSituacao = :situacao where p.tenant = :tenant and p.status = :categoria")
    void reatribuirPorCategoria(@Param("tenant") UUID tenant, @Param("categoria") StatusPedido categoria, @Param("situacao") Long situacao);

    /** Pedidos ainda na cozinha (nas categorias dadas) com prazo de preparo definido, para o aviso de atraso. */
    @Query("select p from T_Pedido p where p.deletado = false and p.tempoPreparoMinutos is not null and p.status in :status")
    List<T_Pedido> buscarComPrazo(@Param("status") Collection<StatusPedido> status);

    /** Histórico do cliente numa loja: mais recentes primeiro, com os itens. */
    @Query("select distinct p from T_Pedido p left join fetch p.itens i left join fetch i.produto "
            + "where p.idClienteConta = :conta and p.tenant = :tenant and p.deletado = false order by p.dataCriacao desc")
    List<T_Pedido> historicoDoCliente(@Param("conta") Long conta, @Param("tenant") UUID tenant);

    /** Pedidos entregues no período que tinham prazo: linhas [total, noPrazo, somaAtrasoMinutos]. */
    @Query(value = "select count(*), "
            + "count(*) filter (where data_atualizacao <= data_criacao + tempo_preparo_minutos * interval '1 minute'), "
            + "coalesce(sum(greatest(0, extract(epoch from (data_atualizacao - (data_criacao + tempo_preparo_minutos * interval '1 minute'))) / 60)), 0) "
            + "from t_pedido where tenant = :tenant and deletado = false and status = 'ENTREGUE' and tempo_preparo_minutos is not null "
            + "and data_criacao >= :de and data_criacao < :ate", nativeQuery = true)
    List<Object[]> resumoDePrazo(@Param("tenant") UUID tenant, @Param("de") LocalDateTime de, @Param("ate") LocalDateTime ate);

    /** Pedidos de entrega ainda não terminados que têm (ou não) entregador: para a visão "em rota". */
    @Query("select p from T_Pedido p where p.tenant = :tenant and p.deletado = false and p.tipoEntrega = com.cardapio.entity.TipoEntrega.ENTREGA "
            + "and p.status in :abertos order by p.dataCriacao")
    List<T_Pedido> buscarEntregasAbertas(@Param("tenant") UUID tenant, @Param("abertos") Collection<StatusPedido> abertos);

    /** Entregas atribuídas a um entregador e ainda em andamento (página do celular dele). */
    @Query("select distinct p from T_Pedido p left join fetch p.itens where p.idEntregador = :entregador and p.deletado = false "
            + "and p.status in :abertos order by p.dataCriacao")
    List<T_Pedido> buscarEntregasDoEntregador(@Param("entregador") Long entregador, @Param("abertos") Collection<StatusPedido> abertos);

    /** Repasse por entregador no período (pela data da entrega): linhas [idEntregador, entregas, repasse]. */
    @Query(value = "select id_entregador, count(*), coalesce(sum(repasse_entregador), 0) from t_pedido "
            + "where tenant = :tenant and deletado = false and status = 'ENTREGUE' and id_entregador is not null "
            + "and coalesce(data_entrega, data_atualizacao) >= :de and coalesce(data_entrega, data_atualizacao) < :ate "
            + "group by id_entregador", nativeQuery = true)
    List<Object[]> repassePorEntregador(@Param("tenant") UUID tenant, @Param("de") LocalDateTime de, @Param("ate") LocalDateTime ate);

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
