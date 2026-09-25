package com.cardapio.repository;

import com.cardapio.entity.T_TransicaoPedido;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface T_TransicaoPedidoRepository extends JpaRepository<T_TransicaoPedido, Long> {

    List<T_TransicaoPedido> findByTenantAndDeletadoFalse(UUID tenant);

    /** As transições são recriadas a cada salvamento do fluxo (apagar de verdade mantém a tabela enxuta). */
    @Modifying
    @Query("delete from T_TransicaoPedido t where t.tenant = :tenant")
    void apagarDaLoja(@Param("tenant") UUID tenant);
}
