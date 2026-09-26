package com.cardapio.repository;

import com.cardapio.entity.T_LojaSite;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface T_LojaSiteRepository extends JpaRepository<T_LojaSite, Long> {

    Optional<T_LojaSite> findByTenantAndDeletadoFalse(UUID tenant);

    Optional<T_LojaSite> findFirstByDominioIgnoreCaseAndDeletadoFalse(String dominio);
}
