package com.cardapio.repository;

import com.cardapio.entity.S_Permissao;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface S_PermissaoRepository extends JpaRepository<S_Permissao, Long> {

    @Query("select p from S_Permissao p join fetch p.pagina pg join fetch pg.categoriaMenu "
            + "where p.ativo = true and p.deletado = false order by pg.ordem, p.ordem")
    List<S_Permissao> listarCatalogo();
}
