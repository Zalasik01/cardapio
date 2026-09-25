package com.cardapio.repository;

import com.cardapio.entity.T_Notificacao;
import com.cardapio.entity.TipoNotificacao;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface T_NotificacaoRepository extends JpaRepository<T_Notificacao, Long> {

    List<T_Notificacao> findByTenantAndDeletadoFalseOrderByIdDesc(UUID tenant, Pageable limite);

    boolean existsByIdPedidoAndTipo(Long idPedido, TipoNotificacao tipo);
}
