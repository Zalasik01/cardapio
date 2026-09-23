package com.cardapio.repository;

import com.cardapio.entity.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {

    List<Produto> findByRestauranteIdAndDisponivelTrueOrderByOrdemExibicaoAsc(Long restauranteId);

    @Query("select p from Produto p join fetch p.categoria where p.restaurante.id = :restauranteId order by p.ordemExibicao asc")
    List<Produto> findByRestauranteIdOrderByOrdemExibicaoAsc(Long restauranteId);

    List<Produto> findByCategoriaId(Long categoriaId);
}
