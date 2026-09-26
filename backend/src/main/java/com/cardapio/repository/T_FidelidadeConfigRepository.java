package com.cardapio.repository;

import com.cardapio.entity.T_FidelidadeConfig;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface T_FidelidadeConfigRepository extends JpaRepository<T_FidelidadeConfig, Long> {

    Optional<T_FidelidadeConfig> findByTenant(UUID tenant);
}
