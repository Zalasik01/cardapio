package com.cardapio.repository;

import com.cardapio.entity.T_Pessoa;
import org.springframework.data.jpa.repository.JpaRepository;

public interface T_PessoaRepository extends JpaRepository<T_Pessoa, Long> {
}
