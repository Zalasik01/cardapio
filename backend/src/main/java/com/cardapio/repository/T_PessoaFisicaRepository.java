package com.cardapio.repository;

import com.cardapio.entity.T_PessoaFisica;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface T_PessoaFisicaRepository extends JpaRepository<T_PessoaFisica, Long> {

    boolean existsByTenantAndCpfAndDeletadoFalse(UUID tenant, String cpf);

    /** Usado na edicao: outro registro (que nao o proprio) ja usa o CPF na loja. */
    boolean existsByTenantAndCpfAndDeletadoFalseAndIdNot(UUID tenant, String cpf, Long id);
}
