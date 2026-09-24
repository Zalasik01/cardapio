package com.cardapio.repository;

import com.cardapio.entity.T_Pessoa;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface T_PessoaRepository extends JpaRepository<T_Pessoa, Long>, JpaSpecificationExecutor<T_Pessoa> {

    @EntityGraph(attributePaths = {"pessoaFisica", "pessoaJuridica"})
    Optional<T_Pessoa> findByIdAndTenantAndDeletadoFalse(Long id, UUID tenant);

    Optional<T_Pessoa> findByPessoaFisicaIdAndDeletadoFalse(Long pessoaFisicaId);

    @Override
    @EntityGraph(attributePaths = {"pessoaFisica", "pessoaJuridica"})
    Page<T_Pessoa> findAll(Specification<T_Pessoa> spec, Pageable pageable);
}
