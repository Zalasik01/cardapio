package com.cardapio.repository;

import com.cardapio.entity.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    @Query("select distinct p from Pedido p left join fetch p.itens i left join fetch i.produto where p.id = :id")
    Optional<Pedido> buscarComItensPorId(Long id);

    @Query("select distinct p from Pedido p left join fetch p.itens i left join fetch i.produto "
            + "where p.restaurante.id = :restauranteId order by p.criadoEm desc")
    List<Pedido> buscarComItensPorRestaurante(Long restauranteId);

    @Query("select distinct p from Pedido p left join fetch p.itens i left join fetch i.produto "
            + "where p.cliente.id = :clienteId order by p.criadoEm desc")
    List<Pedido> buscarComItensPorCliente(Long clienteId);
}
