package com.cardapio.repository;

import com.cardapio.entity.T_Notificacao;
import com.cardapio.entity.TipoNotificacao;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface T_NotificacaoRepository extends JpaRepository<T_Notificacao, Long> {

    List<T_Notificacao> findByTenantAndDeletadoFalseOrderByIdDesc(UUID tenant, Pageable limite);

    /** Apaga de verdade (nada de exclusão lógica: a tabela só guarda o histórico recente do sino). */
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("delete from T_Notificacao n where n.tenant = :tenant")
    int apagarDaLoja(@org.springframework.data.repository.query.Param("tenant") UUID tenant);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("delete from T_Notificacao n where n.dataCriacao < :limite")
    int apagarAnterioresA(@org.springframework.data.repository.query.Param("limite") java.time.LocalDateTime limite);

    boolean existsByIdPedidoAndTipo(Long idPedido, TipoNotificacao tipo);
}
