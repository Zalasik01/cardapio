package com.cardapio.dto.gestao;

import com.cardapio.entity.SituacaoConta;
import com.cardapio.entity.TipoOrganizacao;

/** Filtros da tela de busca de lojas. Campos nulos ou vazios não filtram. */
public record FiltroLojaGestao(
        String busca,
        SituacaoConta situacaoConta,
        TipoOrganizacao tipoOrganizacao,
        boolean mostrarInativos
) {
}
