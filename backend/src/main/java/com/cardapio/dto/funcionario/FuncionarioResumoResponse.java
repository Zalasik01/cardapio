package com.cardapio.dto.funcionario;

import com.cardapio.entity.T_Funcionario;
import com.cardapio.entity.T_PessoaFisica;

import java.util.UUID;

/** Funcionario na tela de busca e na selecao do cadastro de usuario. */
public record FuncionarioResumoResponse(
        Long id,
        String nome,
        String apelido,
        String cpf,
        boolean ativo
) {

    public static FuncionarioResumoResponse of(T_Funcionario funcionario) {
        T_PessoaFisica pessoa = funcionario.getPessoa().getPessoaFisica();
        return new FuncionarioResumoResponse(
                funcionario.getId(), pessoa.getNome(), pessoa.getApelido(), pessoa.getCpf(),
                funcionario.isAtivo());
    }
}
