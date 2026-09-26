package com.cardapio.repository;

import com.cardapio.entity.S_ClienteOtp;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface S_ClienteOtpRepository extends JpaRepository<S_ClienteOtp, Long> {

    Optional<S_ClienteOtp> findFirstByTelefoneAndUsadoFalseOrderByDataCriacaoDesc(String telefone);

    Optional<S_ClienteOtp> findFirstByTelefoneOrderByDataCriacaoDesc(String telefone);

    long countByTelefoneAndDataCriacaoAfter(String telefone, LocalDateTime desde);
}
