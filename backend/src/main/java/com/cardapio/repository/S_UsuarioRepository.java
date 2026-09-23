package com.cardapio.repository;

import com.cardapio.entity.S_Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface S_UsuarioRepository extends JpaRepository<S_Usuario, Long> {

    @Query("select u from S_Usuario u join fetch u.perfil where u.email = :email")
    Optional<S_Usuario> findByEmail(String email);

    boolean existsByEmail(String email);
}
