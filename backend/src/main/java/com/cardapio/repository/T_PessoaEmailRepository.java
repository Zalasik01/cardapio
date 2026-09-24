package com.cardapio.repository;

import com.cardapio.entity.T_PessoaEmail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface T_PessoaEmailRepository extends JpaRepository<T_PessoaEmail, Long> {
    List<T_PessoaEmail> findByPessoaIdOrderByIdAsc(Long pessoaId);

    List<T_PessoaEmail> findByPessoaIdInOrderByIdAsc(java.util.Collection<Long> pessoaIds);

    void deleteByPessoaId(Long pessoaId);
}
