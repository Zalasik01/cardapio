package com.cardapio.repository;

import com.cardapio.entity.S_Perfil;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface S_PerfilRepository extends JpaRepository<S_Perfil, Long> {
    Optional<S_Perfil> findByCodigo(String codigo);
}
