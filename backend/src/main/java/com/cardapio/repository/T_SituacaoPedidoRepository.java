package com.cardapio.repository;

import com.cardapio.entity.T_SituacaoPedido;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface T_SituacaoPedidoRepository extends JpaRepository<T_SituacaoPedido, Long> {

    /** Situações em uso da loja, na ordem do quadro (inclui as inativas). */
    List<T_SituacaoPedido> findByTenantAndDeletadoFalseOrderByOrdemAscIdAsc(UUID tenant);
}
