package com.cardapio.repository;

import com.cardapio.entity.S_Pagina;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface S_PaginaRepository extends JpaRepository<S_Pagina, Long> {
    List<S_Pagina> findByAtivoTrueAndDeletadoFalseOrderByOrdemAsc();
}
