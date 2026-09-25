package com.cardapio.repository;

import com.cardapio.entity.T_Produto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface T_ProdutoRepository extends JpaRepository<T_Produto, Long>, JpaSpecificationExecutor<T_Produto> {

    List<T_Produto> findByTenantAndTipoAndAtivoTrueAndDisponivelTrueAndDeletadoFalseOrderByOrdemExibicaoAsc(UUID tenant, com.cardapio.entity.TipoProduto tipo);

    @Query("select p from T_Produto p join fetch p.categoria where p.tenant = :tenant and p.deletado = false and p.tipo = com.cardapio.entity.TipoProduto.FINAL order by p.ordemExibicao asc")
    List<T_Produto> findByTenantOrderByOrdemExibicaoAsc(UUID tenant);

    Optional<T_Produto> findByGuidAndTenant(UUID guid, UUID tenant);

    // ---- cadastro de produtos (produto final e ingrediente)
    @EntityGraph(attributePaths = {"categoria", "fornecedor", "fornecedor.pessoaFisica", "fornecedor.pessoaJuridica"})
    Optional<T_Produto> findByIdAndTenantAndDeletadoFalse(Long id, UUID tenant);

    /** Maior código numérico já usado na loja (inclusive por produtos excluídos), ou 0. Base do código incremental. */
    @Query(value = "select coalesce(max(cast(codigo as bigint)), 0) from t_produto "
            + "where tenant = :tenant and codigo ~ '^[0-9]{1,15}$'", nativeQuery = true)
    long maiorCodigoNumerico(@Param("tenant") UUID tenant);

    boolean existsByTenantAndCodigoAndDeletadoFalse(UUID tenant, String codigo);

    boolean existsByTenantAndCodigoAndDeletadoFalseAndIdNot(UUID tenant, String codigo, Long id);

    @Override
    @EntityGraph(attributePaths = {"categoria", "fornecedor", "fornecedor.pessoaFisica", "fornecedor.pessoaJuridica"})
    Page<T_Produto> findAll(Specification<T_Produto> spec, Pageable pageable);
}
