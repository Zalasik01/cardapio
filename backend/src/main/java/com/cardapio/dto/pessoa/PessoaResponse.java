package com.cardapio.dto.pessoa;

import com.cardapio.dto.funcionario.EmailDto;
import com.cardapio.dto.funcionario.EnderecoDto;
import com.cardapio.dto.funcionario.TelefoneDto;
import com.cardapio.entity.EstadoCivil;
import com.cardapio.entity.Sexo;
import com.cardapio.entity.TipoPessoa;

import java.time.LocalDate;
import java.util.List;

/** Cadastro completo de cliente/fornecedor. Os campos do outro tipo (fisica x juridica) vem nulos. */
public record PessoaResponse(
        Long id,
        TipoPessoa tipo,
        boolean ativo,
        boolean cliente,
        boolean fornecedor,
        String observacao,
        String nome,
        String apelido,
        String cpf,
        String rg,
        Sexo sexo,
        LocalDate dataNascimento,
        EstadoCivil estadoCivil,
        String profissao,
        String razaoSocial,
        String nomeFantasia,
        String cnpj,
        String inscricaoEstadual,
        String inscricaoMunicipal,
        EnderecoDto endereco,
        List<TelefoneDto> telefones,
        List<EmailDto> emails
) {
}
