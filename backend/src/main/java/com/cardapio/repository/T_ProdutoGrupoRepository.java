package com.cardapio.repository;

import com.cardapio.entity.T_ProdutoGrupo;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface T_ProdutoGrupoRepository extends JpaRepository<T_ProdutoGrupo, Long> {

    List<T_ProdutoGrupo> findByProdutoIdOrderByOrdemAscIdAsc(Long produtoId);

    List<T_ProdutoGrupo> findByProdutoIdInOrderByOrdemAscIdAsc(Collection<Long> produtoIds);

    void deleteByProdutoId(Long produtoId);

    long countByGrupoId(Long grupoId);
}
