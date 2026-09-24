package com.cardapio.repository;

import com.cardapio.entity.S_Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface S_UsuarioRepository extends JpaRepository<S_Usuario, Long>, JpaSpecificationExecutor<S_Usuario> {

    Optional<S_Usuario> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<S_Usuario> findByEsqueciSenhaToken(String token);
}
