package com.cardapio.repository;

import com.cardapio.entity.T_Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface T_CategoriaRepository extends JpaRepository<T_Categoria, Long>, JpaSpecificationExecutor<T_Categoria> {

    /** Próxima posição livre no cardápio: a maior ordem da loja + 1 (1 quando ainda não há categorias). */
    @org.springframework.data.jpa.repository.Query("select coalesce(max(c.ordemExibicao), 0) + 1 from T_Categoria c "
            + "where c.tenant = :tenant and c.deletado = false")
    int proximaOrdem(@org.springframework.data.repository.query.Param("tenant") java.util.UUID tenant);
    List<T_Categoria> findByTenantAndAtivoTrueAndDeletadoFalseOrderByOrdemExibicaoAsc(UUID tenant);
    List<T_Categoria> findByTenantAndDeletadoFalseOrderByOrdemExibicaoAsc(UUID tenant);
    Optional<T_Categoria> findByIdAndTenantAndDeletadoFalse(Long id, UUID tenant);

    boolean existsByTenantAndNomeIgnoreCaseAndDeletadoFalse(UUID tenant, String nome);

    boolean existsByTenantAndNomeIgnoreCaseAndDeletadoFalseAndIdNot(UUID tenant, String nome, Long id);
}
