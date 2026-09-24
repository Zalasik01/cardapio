package com.cardapio.dto.funcionario;

import com.cardapio.entity.EstadoCivil;
import com.cardapio.entity.Sexo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.br.CPF;

import java.time.LocalDate;
import java.util.List;

/**
 * Cadastro/edicao de funcionario. Telefones e e-mails substituem, por completo, os ja
 * cadastrados. O CPF pode vir formatado; e validado (digitos verificadores) e guardado so com digitos.
 */
public record FuncionarioRequest(
        Boolean ativo,
        Sexo sexo,
        @NotBlank @CPF(message = "CPF inválido") String cpf,
        @Size(max = 30) String rg,
        @Size(max = 255) String apelido,
        @NotBlank @Size(max = 255) String nome,
        @Size(max = 255) String naturalidade,
        @Size(max = 255) String nacionalidade,
        LocalDate dataNascimento,
        @Size(max = 255) String profissao,
        EstadoCivil estadoCivil,
        @Size(max = 20) String numeroCnh,
        LocalDate vencimentoCnh,
        @Size(max = 2000) String observacao,
        @Valid EnderecoDto endereco,
        @Valid List<TelefoneDto> telefones,
        @Valid List<EmailDto> emails
) {
}
