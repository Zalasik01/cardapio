package com.cardapio.repository;

import com.cardapio.entity.S_CategoriaMenu;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface S_CategoriaMenuRepository extends JpaRepository<S_CategoriaMenu, Long> {
    List<S_CategoriaMenu> findByAtivoTrueAndDeletadoFalseOrderByOrdemAsc();
}
