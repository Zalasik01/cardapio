package com.cardapio.repository;

import com.cardapio.entity.T_CupomUso;
import org.springframework.data.jpa.repository.JpaRepository;

public interface T_CupomUsoRepository extends JpaRepository<T_CupomUso, Long> {

    long countByIdCupom(Long idCupom);

    long countByIdCupomAndIdClienteConta(Long idCupom, Long idClienteConta);
}
