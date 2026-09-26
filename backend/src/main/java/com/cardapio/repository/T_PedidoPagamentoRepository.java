package com.cardapio.repository;

import com.cardapio.entity.T_PedidoPagamento;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface T_PedidoPagamentoRepository extends JpaRepository<T_PedidoPagamento, Long> {

    List<T_PedidoPagamento> findByIdPedidoOrderByIdAsc(Long idPedido);

    List<T_PedidoPagamento> findByIdPedidoInOrderByIdAsc(Collection<Long> idsPedido);

    /** Os pagamentos são regravados por inteiro a cada edição do pedido. */
    @Modifying
    @Query("delete from T_PedidoPagamento p where p.idPedido = :idPedido")
    void apagarDoPedido(@Param("idPedido") Long idPedido);
}
