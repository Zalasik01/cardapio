package com.cardapio.repository;

import com.cardapio.entity.T_PerfilUsuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface T_PerfilUsuarioRepository
        extends JpaRepository<T_PerfilUsuario, Long>, JpaSpecificationExecutor<T_PerfilUsuario> {

    /**
     * Vinculos que dao acesso a uma loja: ativos, status ATIVO e em lojas ativas,
     * ja com loja e papel carregados.
     */
    @Query("select p from T_PerfilUsuario p join fetch p.loja l join fetch p.perfil "
            + "where p.usuario.id = :usuarioId and p.ativo = true and p.deletado = false "
            + "and p.status = com.cardapio.entity.StatusPerfilUsuario.ATIVO "
            + "and l.ativo = true and l.deletado = false order by l.nome")
    List<T_PerfilUsuario> buscarAtivosPorUsuario(Long usuarioId);

    /** Vinculo do usuario com a loja, mesmo que excluido (existe uma unica linha por usuario/loja). */
    Optional<T_PerfilUsuario> findByUsuarioIdAndTenant(Long usuarioId, UUID tenant);

    Optional<T_PerfilUsuario> findByUsuarioGuidAndTenantAndDeletadoFalse(UUID usuarioGuid, UUID tenant);

    List<T_PerfilUsuario> findByUsuarioIdAndDeletadoFalse(Long usuarioId);

    @Override
    @EntityGraph(attributePaths = {"usuario", "perfil", "pessoa", "pessoa.pessoaFisica"})
    Page<T_PerfilUsuario> findAll(org.springframework.data.jpa.domain.Specification<T_PerfilUsuario> spec, Pageable pageable);
}
