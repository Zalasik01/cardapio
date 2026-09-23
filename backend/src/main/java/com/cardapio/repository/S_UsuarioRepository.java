package com.cardapio.repository;

import com.cardapio.entity.S_Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface S_UsuarioRepository extends JpaRepository<S_Usuario, Long> {

    Optional<S_Usuario> findByEmail(String email);

    boolean existsByEmail(String email);
}
