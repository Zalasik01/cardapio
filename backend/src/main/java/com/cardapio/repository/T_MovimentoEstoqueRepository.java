package com.cardapio.repository;

import com.cardapio.entity.T_MovimentoEstoque;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface T_MovimentoEstoqueRepository extends JpaRepository<T_MovimentoEstoque, Long> {

    List<T_MovimentoEstoque> findByTenantAndIngredienteIdOrderByDataHoraDescIdDesc(UUID tenant, Long ingredienteId, Pageable pageable);

    List<T_MovimentoEstoque> findByIdPedidoAndTipo(Long idPedido, String tipo);
}
