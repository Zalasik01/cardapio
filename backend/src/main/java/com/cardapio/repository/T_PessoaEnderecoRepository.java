package com.cardapio.repository;

import com.cardapio.entity.T_PessoaEndereco;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface T_PessoaEnderecoRepository extends JpaRepository<T_PessoaEndereco, Long> {

    /** Todos os endereços da pessoa, o principal primeiro. */
    List<T_PessoaEndereco> findByPessoaIdOrderByPrincipalDescIdAsc(Long pessoaId);

    /** O endereço principal (na falta dele, o mais antigo). */
    Optional<T_PessoaEndereco> findFirstByPessoaIdOrderByPrincipalDescIdAsc(Long pessoaId);

    void deleteByPessoaId(Long pessoaId);
}
