package com.cardapio.dto.gestao;

import com.cardapio.dto.funcionario.EmailDto;
import com.cardapio.dto.funcionario.TelefoneDto;
import com.cardapio.entity.S_Loja;
import com.cardapio.entity.SituacaoConta;
import com.cardapio.entity.TipoOrganizacao;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/** Loja completa na Gestão Interna. O tenant é o guid que as tabelas da loja usam para se ligar a ela. */
public record LojaGestaoResponse(
        Long id,
        UUID tenant,
        boolean ativo,
        String nome,
        String slug,
        TipoOrganizacao tipoOrganizacao,
        SituacaoConta situacaoConta,
        String descricao,
        String logoUrl,
        String enderecoRua,
        String enderecoNumero,
        String enderecoComplemento,
        String enderecoBairro,
        String enderecoCidade,
        String enderecoEstado,
        String enderecoCep,
        String cnpj,
        BigDecimal valorMensalidade,
        Integer diaVencimento,
        List<TelefoneDto> telefones,
        List<EmailDto> emails
) {

    public static LojaGestaoResponse of(S_Loja l, List<TelefoneDto> telefones, List<EmailDto> emails) {
        return new LojaGestaoResponse(
                l.getId(), l.getGuid(), l.isAtivo(), l.getNome(), l.getSlug(), l.getTipoOrganizacao(), l.getSituacaoConta(),
                l.getDescricao(), l.getLogoUrl(), l.getEnderecoRua(), l.getEnderecoNumero(), l.getEnderecoComplemento(),
                l.getEnderecoBairro(), l.getEnderecoCidade(), l.getEnderecoEstado(), l.getEnderecoCep(),
                l.getCnpj(), l.getValorMensalidade(), l.getDiaVencimento(), telefones, emails);
    }
}
