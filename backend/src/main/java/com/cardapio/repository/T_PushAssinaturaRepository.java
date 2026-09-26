package com.cardapio.repository;

import com.cardapio.entity.T_PushAssinatura;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface T_PushAssinaturaRepository extends JpaRepository<T_PushAssinatura, Long> {

    List<T_PushAssinatura> findByTipoAndIdEntregador(String tipo, Long idEntregador);

    List<T_PushAssinatura> findByTipoAndIdPedido(String tipo, Long idPedido);

    Optional<T_PushAssinatura> findFirstByEndpointAndTipoAndIdEntregadorAndIdPedido(String endpoint, String tipo, Long idEntregador, Long idPedido);
}
