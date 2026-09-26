package com.cardapio.repository;

import com.cardapio.entity.T_Avaliacao;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface T_AvaliacaoRepository extends JpaRepository<T_Avaliacao, Long> {

    Optional<T_Avaliacao> findByIdPedidoAndDeletadoFalse(Long idPedido);

    Optional<T_Avaliacao> findByIdAndTenantAndDeletadoFalse(Long id, UUID tenant);

    /** Filtro opcional por nota da loja (:nota) e por "ainda sem resposta". */
    @Query("select a from T_Avaliacao a where a.tenant = :tenant and a.deletado = false "
            + "and (:nota is null or a.notaLoja = :nota) and (:semResposta = false or a.resposta is null) order by a.criadoEm desc")
    Page<T_Avaliacao> buscar(@Param("tenant") UUID tenant, @Param("nota") Short nota, @Param("semResposta") boolean semResposta, Pageable pagina);

    /** [quantidade, média da loja, média da entrega] da loja. */
    @Query("select count(a), coalesce(avg(a.notaLoja), 0), avg(a.notaEntrega) from T_Avaliacao a where a.tenant = :tenant and a.deletado = false")
    List<Object[]> resumo(@Param("tenant") UUID tenant);
}
