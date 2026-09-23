package com.cardapio.repository;

import com.cardapio.entity.T_Funcionario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface T_FuncionarioRepository
        extends JpaRepository<T_Funcionario, Long>, JpaSpecificationExecutor<T_Funcionario> {

    @EntityGraph(attributePaths = {"pessoa", "pessoa.pessoaFisica"})
    Optional<T_Funcionario> findByGuidAndTenantAndDeletadoFalse(UUID guid, UUID tenant);

    @EntityGraph(attributePaths = {"pessoa", "pessoa.pessoaFisica"})
    List<T_Funcionario> findByPessoaIdIn(Collection<Long> pessoaIds);

    @Override
    @EntityGraph(attributePaths = {"pessoa", "pessoa.pessoaFisica"})
    Page<T_Funcionario> findAll(Specification<T_Funcionario> spec, Pageable pageable);
}
