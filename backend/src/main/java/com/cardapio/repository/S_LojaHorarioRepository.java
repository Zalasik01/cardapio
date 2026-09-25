package com.cardapio.repository;

import com.cardapio.entity.S_LojaHorario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface S_LojaHorarioRepository extends JpaRepository<S_LojaHorario, Long> {

    List<S_LojaHorario> findByLojaIdOrderByDiaSemanaAscAbreAsc(Long lojaId);

    void deleteByLojaId(Long lojaId);
}
