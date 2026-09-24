package com.cardapio.dto.pessoa;

import com.cardapio.dto.funcionario.EmailDto;
import com.cardapio.dto.funcionario.EnderecoDto;
import com.cardapio.dto.funcionario.TelefoneDto;
import com.cardapio.entity.EstadoCivil;
import com.cardapio.entity.Sexo;
import com.cardapio.entity.TipoPessoa;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.br.CNPJ;
import org.hibernate.validator.constraints.br.CPF;

import java.time.LocalDate;
import java.util.List;

/**
 * Cadastro/edicao de cliente e/ou fornecedor. Para pessoa fisica valem nome/cpf/...; para
 * juridica, razaoSocial/nomeFantasia/cnpj/... (a obrigatoriedade por tipo e checada no service).
 * Telefones e e-mails substituem, por completo, os ja cadastrados.
 */
public record PessoaRequest(
        @NotNull TipoPessoa tipo,
        Boolean ativo,
        boolean cliente,
        boolean fornecedor,
        @Size(max = 2000) String observacao,
        // pessoa fisica
        @Size(max = 255) String nome,
        @Size(max = 255) String apelido,
        @CPF(message = "CPF inválido") String cpf,
        @Size(max = 30) String rg,
        Sexo sexo,
        LocalDate dataNascimento,
        EstadoCivil estadoCivil,
        @Size(max = 255) String profissao,
        // pessoa juridica
        @Size(max = 255) String razaoSocial,
        @Size(max = 255) String nomeFantasia,
        @CNPJ(message = "CNPJ inválido") String cnpj,
        @Size(max = 30) String inscricaoEstadual,
        @Size(max = 30) String inscricaoMunicipal,
        @Valid EnderecoDto endereco,
        @Valid List<TelefoneDto> telefones,
        @Valid List<EmailDto> emails
) {

    /** Documento em branco (campo vazio do formulario) equivale a nao informado: o @CPF/@CNPJ rejeitaria a string vazia. */
    public PessoaRequest {
        cpf = cpf == null || cpf.isBlank() ? null : cpf;
        cnpj = cnpj == null || cnpj.isBlank() ? null : cnpj;
    }
}
