package com.cardapio.dto.gestao;

import com.cardapio.dto.funcionario.EmailDto;
import com.cardapio.dto.funcionario.TelefoneDto;
import com.cardapio.entity.SituacaoConta;
import com.cardapio.entity.TipoOrganizacao;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.br.CNPJ;

import java.math.BigDecimal;
import java.util.List;

/** Cadastro/edição de uma loja pela Gestão Interna. O slug é o endereço público da loja. */
public record LojaGestaoRequest(
        Boolean ativo,
        @NotBlank @Size(max = 255) String nome,
        @NotBlank @Size(max = 255)
        @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$", message = "Use apenas letras minúsculas, números e hífens (ex.: minha-loja)")
        String slug,
        @NotNull TipoOrganizacao tipoOrganizacao,
        @NotNull SituacaoConta situacaoConta,
        @Size(max = 255) String descricao,
        @Size(max = 255) String logoUrl,
        @Size(max = 255) String enderecoRua,
        @Size(max = 20) String enderecoNumero,
        @Size(max = 255) String enderecoComplemento,
        @Size(max = 255) String enderecoBairro,
        @Size(max = 255) String enderecoCidade,
        @Size(max = 2) String enderecoEstado,
        @Size(max = 9) String enderecoCep,
        @CNPJ(message = "CNPJ inválido") String cnpj,
        @PositiveOrZero BigDecimal valorMensalidade,
        @Min(1) @Max(28) Integer diaVencimento,
        @Valid List<TelefoneDto> telefones,
        @Valid List<EmailDto> emails
) {

    /** CNPJ em branco (campo vazio do formulário) equivale a não informado: o @CNPJ rejeitaria a string vazia. */
    public LojaGestaoRequest {
        cnpj = cnpj == null || cnpj.isBlank() ? null : cnpj;
    }
}
