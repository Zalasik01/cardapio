package com.cardapio.dto.pessoa;

import com.cardapio.entity.T_Pessoa;
import com.cardapio.entity.TipoPessoa;

import java.util.List;

/** Cliente/fornecedor na tela de busca. "nome" e o nome (fisica) ou a razao social (juridica). */
public record PessoaResumoResponse(
        Long id,
        TipoPessoa tipo,
        String nome,
        String apelidoOuFantasia,
        String documento,
        boolean cliente,
        boolean fornecedor,
        boolean ativo,
        List<String> telefones,
        List<String> emails,
        String origem
) {

    public static PessoaResumoResponse of(T_Pessoa pessoa, List<String> telefones, List<String> emails) {
        var pf = pessoa.getPessoaFisica();
        var pj = pessoa.getPessoaJuridica();
        boolean fisica = pf != null;
        return new PessoaResumoResponse(
                pessoa.getId(),
                fisica ? TipoPessoa.FISICA : TipoPessoa.JURIDICA,
                fisica ? pf.getNome() : pj.getRazaoSocial(),
                fisica ? pf.getApelido() : pj.getNomeFantasia(),
                fisica ? pf.getCpf() : pj.getCnpj(),
                pessoa.isCliente(), pessoa.isFornecedor(), pessoa.isAtivo(), telefones, emails, pessoa.getOrigem());
    }
}
