package com.cardapio.dto.gestao;

import com.cardapio.entity.S_Loja;
import com.cardapio.entity.SituacaoConta;
import com.cardapio.entity.TipoOrganizacao;

/** Loja na tela de busca da Gestão Interna. */
public record LojaGestaoResumoResponse(
        Long id,
        String nome,
        String slug,
        TipoOrganizacao tipoOrganizacao,
        SituacaoConta situacaoConta,
        String cidade,
        String estado,
        String telefone,
        boolean ativo
) {

    public static LojaGestaoResumoResponse of(S_Loja l) {
        return new LojaGestaoResumoResponse(
                l.getId(), l.getNome(), l.getSlug(), l.getTipoOrganizacao(), l.getSituacaoConta(),
                l.getEnderecoCidade(), l.getEnderecoEstado(), l.getTelefone(), l.isAtivo());
    }
}
