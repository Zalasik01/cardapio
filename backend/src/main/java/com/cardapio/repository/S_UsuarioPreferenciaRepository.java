package com.cardapio.repository;

import com.cardapio.entity.S_UsuarioPreferencia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface S_UsuarioPreferenciaRepository extends JpaRepository<S_UsuarioPreferencia, Long> {

    Optional<S_UsuarioPreferencia> findByUsuarioIdAndChave(Long usuarioId, String chave);
}
