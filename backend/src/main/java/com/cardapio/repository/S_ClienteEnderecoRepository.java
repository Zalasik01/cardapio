package com.cardapio.repository;

import com.cardapio.entity.S_ClienteEndereco;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface S_ClienteEnderecoRepository extends JpaRepository<S_ClienteEndereco, Long> {

    List<S_ClienteEndereco> findByIdClienteContaAndDeletadoFalseOrderByCriadoEmDesc(Long idClienteConta);

    Optional<S_ClienteEndereco> findByIdAndIdClienteContaAndDeletadoFalse(Long id, Long idClienteConta);

    long countByIdClienteContaAndDeletadoFalse(Long idClienteConta);
}
