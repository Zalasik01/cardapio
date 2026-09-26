package com.cardapio.repository;

import com.cardapio.entity.T_PedidoTrilha;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface T_PedidoTrilhaRepository extends JpaRepository<T_PedidoTrilha, Long> {

    /** Últimos pontos do pedido (mais novos primeiro); o serviço inverte para desenhar do começo ao fim. */
    @Query("select t from T_PedidoTrilha t where t.idPedido = :pedido order by t.registradoEm desc")
    List<T_PedidoTrilha> ultimos(@Param("pedido") Long pedido, Pageable limite);
}
