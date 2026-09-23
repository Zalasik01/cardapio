package com.cardapio.repository;

import com.cardapio.entity.ZonaEntrega;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ZonaEntregaRepository extends JpaRepository<ZonaEntrega, Long> {
    List<ZonaEntrega> findByRestauranteIdOrderByBairroAsc(Long restauranteId);
    Optional<ZonaEntrega> findByRestauranteIdAndBairroIgnoreCaseAndAtivoTrue(Long restauranteId, String bairro);
}
