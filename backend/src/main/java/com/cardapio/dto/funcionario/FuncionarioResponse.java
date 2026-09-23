package com.cardapio.dto.funcionario;

import com.cardapio.entity.EstadoCivil;
import com.cardapio.entity.Sexo;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Funcionario completo (tela de cadastro). */
public record FuncionarioResponse(
        UUID guid,
        boolean ativo,
        Sexo sexo,
        String cpf,
        String rg,
        String apelido,
        String nome,
        String naturalidade,
        String nacionalidade,
        LocalDate dataNascimento,
        String profissao,
        EstadoCivil estadoCivil,
        String numeroCnh,
        LocalDate vencimentoCnh,
        String observacao,
        EnderecoDto endereco,
        List<TelefoneDto> telefones,
        List<EmailDto> emails
) {
}
