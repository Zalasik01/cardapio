package com.cardapio.dto.produto;

import com.cardapio.entity.TipoProduto;
import com.cardapio.entity.UnidadeMedida;

import java.math.BigDecimal;
import java.util.List;

/** Produto completo. Os campos do outro tipo vêm nulos/vazios; custoEstimado = soma da composição (só produto final). */
public record ProdutoCadastroResponse(
        Long id,
        TipoProduto tipo,
        boolean ativo,
        String codigo,
        String nome,
        String descricao,
        UnidadeMedida unidadeMedida,
        String observacao,
        Long categoriaId,
        String categoriaNome,
        BigDecimal preco,
        String imagemUrl,
        boolean disponivel,
        List<ItemComposicao> composicao,
        BigDecimal custoEstimado,
        BigDecimal custoUnitario,
        Long fornecedorId,
        String fornecedorNome,
        Integer tempoPreparoMinutos,
        BigDecimal precoPromocional,
        boolean destaque
) {

    public record ItemComposicao(
            Long ingredienteId,
            String ingredienteNome,
            UnidadeMedida unidadeMedida,
            BigDecimal quantidade,
            BigDecimal custoUnitario,
            BigDecimal custoTotal
    ) {
    }
}
