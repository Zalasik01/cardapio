package com.cardapio.repository;

import com.cardapio.entity.T_Opcao;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface T_OpcaoRepository extends JpaRepository<T_Opcao, Long> {

    List<T_Opcao> findByIdInAndTenantAndDeletadoFalse(Collection<Long> ids, UUID tenant);
}
