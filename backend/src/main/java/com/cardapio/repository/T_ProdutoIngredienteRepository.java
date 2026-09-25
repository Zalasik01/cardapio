package com.cardapio.repository;

import com.cardapio.entity.T_ProdutoIngrediente;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface T_ProdutoIngredienteRepository extends JpaRepository<T_ProdutoIngrediente, Long> {

    @EntityGraph(attributePaths = {"ingrediente"})
    List<T_ProdutoIngrediente> findByProdutoIdOrderByIdAsc(Long produtoId);

    void deleteByProdutoId(Long produtoId);

    /** Remove o ingrediente de toda composição (só sobra em produtos já excluídos, pois o uso ativo bloqueia a exclusão). */
    void deleteByIngredienteId(Long ingredienteId);

    /** Quantos produtos finais (não excluídos) usam o ingrediente: ele só pode ser excluído se ninguém usa. */
    @Query("select count(distinct pi.produto.id) from T_ProdutoIngrediente pi "
            + "where pi.ingrediente.id = :ingredienteId and pi.produto.deletado = false")
    long contarProdutosQueUsam(@Param("ingredienteId") Long ingredienteId);
}
