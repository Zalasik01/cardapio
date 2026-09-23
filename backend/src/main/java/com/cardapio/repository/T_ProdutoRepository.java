package com.cardapio.repository;

import com.cardapio.entity.T_Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface T_ProdutoRepository extends JpaRepository<T_Produto, Long> {

    List<T_Produto> findByTenantAndDisponivelTrueAndDeletadoFalseOrderByOrdemExibicaoAsc(UUID tenant);

    @Query("select p from T_Produto p join fetch p.categoria where p.tenant = :tenant and p.deletado = false order by p.ordemExibicao asc")
    List<T_Produto> findByTenantOrderByOrdemExibicaoAsc(UUID tenant);

    Optional<T_Produto> findByGuidAndTenant(UUID guid, UUID tenant);
}
