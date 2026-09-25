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

    /**
     * Menor número (a partir de 1) que nenhum produto não excluído da loja usa como código. Os buracos deixados por
     * exclusões são reaproveitados: com os códigos 2 e 3 em uso, devolve 1. Só códigos puramente numéricos contam.
     */
    @Query(value = "select min(n) from generate_series(1, ("
            + "select coalesce(max(case when codigo ~ '^[0-9]{1,15}$' then cast(codigo as bigint) end), 0) + 1 "
            + "from t_produto where tenant = :tenant and deletado = false)) as n "
            + "where not exists (select 1 from t_produto where tenant = :tenant and deletado = false "
            + "and case when codigo ~ '^[0-9]{1,15}$' then cast(codigo as bigint) end = n)", nativeQuery = true)
    long menorCodigoNumericoLivre(@Param("tenant") UUID tenant);

    /** Quantos itens de pedido já venderam o produto: se houver, o histórico impede a exclusão definitiva. */
    @Query("select count(i) from I_ItemPedido i where i.produto.id = :produtoId")
    long contarItensDePedido(@Param("produtoId") Long produtoId);

    /** Quantos produtos (não excluídos) pertencem à categoria: ela só pode ser excluída se não houver nenhum. */
    long countByCategoriaIdAndDeletadoFalse(Long categoriaId);

    /** Quantos produtos (inclusive excluídos, já vendidos) ainda apontam para a categoria. */
    long countByCategoriaId(Long categoriaId);

    /** Quantidade de produtos não excluídos por categoria: linhas [categoriaId, quantidade]. */
    @Query("select p.categoria.id, count(p) from T_Produto p "
            + "where p.categoria.id in :ids and p.deletado = false group by p.categoria.id")
    List<Object[]> contarPorCategoria(@Param("ids") java.util.Collection<Long> ids);

    boolean existsByTenantAndCodigoAndDeletadoFalse(UUID tenant, String codigo);

    boolean existsByTenantAndCodigoAndDeletadoFalseAndIdNot(UUID tenant, String codigo, Long id);

    @Override
    @EntityGraph(attributePaths = {"categoria", "fornecedor", "fornecedor.pessoaFisica", "fornecedor.pessoaJuridica"})
    Page<T_Produto> findAll(Specification<T_Produto> spec, Pageable pageable);
}
