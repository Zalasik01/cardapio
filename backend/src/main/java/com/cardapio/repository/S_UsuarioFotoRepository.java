package com.cardapio.repository;

import com.cardapio.entity.S_UsuarioFoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface S_UsuarioFotoRepository extends JpaRepository<S_UsuarioFoto, Long> {

    Optional<S_UsuarioFoto> findByUsuarioId(Long usuarioId);

    boolean existsByUsuarioId(Long usuarioId);

    /** Ids dos usuarios (dentre os informados) que tem foto, sem carregar a imagem. */
    @Query("select f.usuario.id from S_UsuarioFoto f where f.usuario.id in :usuarioIds")
    List<Long> buscarUsuariosComFoto(Collection<Long> usuarioIds);
}
