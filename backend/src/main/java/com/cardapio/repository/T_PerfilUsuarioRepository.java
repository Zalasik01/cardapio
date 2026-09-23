package com.cardapio.repository;

import com.cardapio.entity.T_PerfilUsuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface T_PerfilUsuarioRepository extends JpaRepository<T_PerfilUsuario, Long> {

    /** Perfis ativos do usuario em lojas ativas, ja com loja e papel carregados. */
    @Query("select p from T_PerfilUsuario p join fetch p.loja l join fetch p.perfil "
            + "where p.usuario.id = :usuarioId and p.ativo = true and p.deletado = false "
            + "and l.ativo = true and l.deletado = false order by l.nome")
    List<T_PerfilUsuario> buscarAtivosPorUsuario(Long usuarioId);
}
