package com.cardapio.repository;

import com.cardapio.entity.T_PessoaEndereco;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface T_PessoaEnderecoRepository extends JpaRepository<T_PessoaEndereco, Long> {
    Optional<T_PessoaEndereco> findByPessoaId(Long pessoaId);
}
