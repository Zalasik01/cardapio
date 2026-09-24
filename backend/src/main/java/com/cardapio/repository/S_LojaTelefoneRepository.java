package com.cardapio.repository;

import com.cardapio.entity.S_LojaTelefone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface S_LojaTelefoneRepository extends JpaRepository<S_LojaTelefone, Long> {

    List<S_LojaTelefone> findByLojaIdOrderByIdAsc(Long lojaId);

    void deleteByLojaId(Long lojaId);
}
