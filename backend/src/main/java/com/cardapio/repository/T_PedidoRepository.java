package com.cardapio.repository;

import com.cardapio.entity.T_Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface T_PedidoRepository extends JpaRepository<T_Pedido, Long> {

    @Query("select distinct p from T_Pedido p left join fetch p.itens i left join fetch i.produto where p.guid = :guid")
    Optional<T_Pedido> buscarComItensPorGuid(UUID guid);

    @Query("select distinct p from T_Pedido p left join fetch p.itens i left join fetch i.produto "
            + "where p.tenant = :tenant order by p.dataCriacao desc")
    List<T_Pedido> buscarComItensPorTenant(UUID tenant);

    @Query("select distinct p from T_Pedido p left join fetch p.itens i left join fetch i.produto "
            + "where p.cliente.id = :clienteId order by p.dataCriacao desc")
    List<T_Pedido> buscarComItensPorCliente(Long clienteId);
}
