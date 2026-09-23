package com.cardapio.repository;

import com.cardapio.entity.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
    List<Categoria> findByRestauranteIdAndAtivoTrueOrderByOrdemExibicaoAsc(Long restauranteId);
    List<Categoria> findByRestauranteIdOrderByOrdemExibicaoAsc(Long restauranteId);
}
