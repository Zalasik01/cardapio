package com.cardapio.repository;

import com.cardapio.entity.T_PessoaJuridica;
import org.springframework.data.jpa.repository.JpaRepository;

public interface T_PessoaJuridicaRepository extends JpaRepository<T_PessoaJuridica, Long> {

    boolean existsByTenantAndCnpjAndDeletadoFalse(java.util.UUID tenant, String cnpj);

    /** Usado na edicao: outro registro (que nao o proprio) ja usa o CNPJ na loja. */
    boolean existsByTenantAndCnpjAndDeletadoFalseAndIdNot(java.util.UUID tenant, String cnpj, Long id);
}
