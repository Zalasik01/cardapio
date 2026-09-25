package com.cardapio.repository;

import com.cardapio.entity.T_PedidoAlteracao;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface T_PedidoAlteracaoRepository extends JpaRepository<T_PedidoAlteracao, Long> {

    List<T_PedidoAlteracao> findByIdPedidoOrderByIdDesc(Long idPedido);

    List<T_PedidoAlteracao> findByIdPedidoInOrderByIdDesc(Collection<Long> idsPedido);
}
