package com.cardapio.repository;

import com.cardapio.entity.S_LojaEmail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface S_LojaEmailRepository extends JpaRepository<S_LojaEmail, Long> {

    List<S_LojaEmail> findByLojaIdOrderByIdAsc(Long lojaId);

    void deleteByLojaId(Long lojaId);
}
