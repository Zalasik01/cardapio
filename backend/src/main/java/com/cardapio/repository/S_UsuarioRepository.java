package com.cardapio.repository;

import com.cardapio.entity.S_Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface S_UsuarioRepository extends JpaRepository<S_Usuario, Long>, JpaSpecificationExecutor<S_Usuario> {

    Optional<S_Usuario> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<S_Usuario> findByEsqueciSenhaToken(String token);

    // ---- números da Gestão Interna (usuários internos = suporte ou administradores da plataforma)
    @Query("select count(u) from S_Usuario u where u.deletado = false and (u.usuarioSuporte = true or u.usuarioAdministrador = true)")
    long contarInternos();

    @Query("select count(u) from S_Usuario u where u.deletado = false and u.usuarioAdministrador = true")
    long contarAdministradores();

    @Query("select count(u) from S_Usuario u where u.deletado = false and u.exigeTrocarSenha = true "
            + "and u.esqueciSenhaToken is not null and (u.usuarioSuporte = true or u.usuarioAdministrador = true)")
    long contarInternosPendentes();
}
