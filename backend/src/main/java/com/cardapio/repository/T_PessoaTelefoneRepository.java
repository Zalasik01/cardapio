package com.cardapio.repository;

import com.cardapio.entity.T_PessoaTelefone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface T_PessoaTelefoneRepository extends JpaRepository<T_PessoaTelefone, Long> {
    List<T_PessoaTelefone> findByPessoaIdOrderByIdAsc(Long pessoaId);

    List<T_PessoaTelefone> findByPessoaIdInOrderByIdAsc(java.util.Collection<Long> pessoaIds);

    void deleteByPessoaId(Long pessoaId);

    /** Clientes da loja cujo telefone termina com os dígitos dados (ignora máscara: parênteses, espaço e hífen). */
    @org.springframework.data.jpa.repository.Query("select distinct t.pessoa from T_PessoaTelefone t where t.pessoa.tenant = :tenant "
            + "and t.pessoa.deletado = false and t.pessoa.cliente = true "
            + "and replace(replace(replace(replace(t.numero, '(', ''), ')', ''), ' ', ''), '-', '') like :final")
    List<com.cardapio.entity.T_Pessoa> clientesComTelefone(@org.springframework.data.repository.query.Param("tenant") java.util.UUID tenant,
                                                            @org.springframework.data.repository.query.Param("final") String terminaCom);
}
