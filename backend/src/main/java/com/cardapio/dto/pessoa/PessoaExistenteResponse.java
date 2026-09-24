package com.cardapio.dto.pessoa;

import com.cardapio.dto.funcionario.EmailDto;
import com.cardapio.dto.funcionario.EnderecoDto;
import com.cardapio.dto.funcionario.TelefoneDto;
import com.cardapio.entity.EstadoCivil;
import com.cardapio.entity.Sexo;

import java.time.LocalDate;
import java.util.List;

/**
 * Pessoa fisica que ja existe na loja com o CPF consultado. Serve para os cadastros de
 * funcionario e de cliente/fornecedor reaproveitarem os dados: a pessoa e a mesma, entao o que
 * for salvo em um cadastro reflete no outro. funcionarioId e nulo se ela nao e funcionario.
 */
public record PessoaExistenteResponse(
        Long pessoaId,
        String nome,
        String apelido,
        String cpf,
        String rg,
        Sexo sexo,
        LocalDate dataNascimento,
        EstadoCivil estadoCivil,
        String profissao,
        String naturalidade,
        String nacionalidade,
        String observacao,
        EnderecoDto endereco,
        List<TelefoneDto> telefones,
        List<EmailDto> emails,
        Long funcionarioId,
        String numeroCnh,
        LocalDate vencimentoCnh,
        boolean cliente,
        boolean fornecedor
) {
}
