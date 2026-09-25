package com.cardapio.repository;

import com.cardapio.entity.T_PermissaoUsuario;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface T_PermissaoUsuarioRepository extends JpaRepository<T_PermissaoUsuario, Long> {

    /** Códigos das permissões do usuário na loja. */
    @Query("select pe.codigo from T_PermissaoUsuario pu join pu.permissao pe join pu.perfilUsuario pf "
            + "where pf.usuario.id = :usuarioId and pf.tenant = :tenant and pf.deletado = false "
            + "and pu.ativo = true and pu.deletado = false and pe.ativo = true")
    List<String> codigosDoUsuario(Long usuarioId, UUID tenant);

    @Modifying
    @Query("delete from T_PermissaoUsuario pu where pu.perfilUsuario.id = :perfilUsuarioId")
    void removerDoPerfilUsuario(Long perfilUsuarioId);
}
