package com.cardapio.repository;

import com.cardapio.entity.T_PessoaTelefone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface T_PessoaTelefoneRepository extends JpaRepository<T_PessoaTelefone, Long> {
    List<T_PessoaTelefone> findByPessoaIdOrderByIdAsc(Long pessoaId);

    void deleteByPessoaId(Long pessoaId);
}
