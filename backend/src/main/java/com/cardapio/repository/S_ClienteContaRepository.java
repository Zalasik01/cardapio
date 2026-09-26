package com.cardapio.repository;

import com.cardapio.entity.S_ClienteConta;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface S_ClienteContaRepository extends JpaRepository<S_ClienteConta, Long> {

    Optional<S_ClienteConta> findByTelefoneAndDeletadoFalse(String telefone);
}
