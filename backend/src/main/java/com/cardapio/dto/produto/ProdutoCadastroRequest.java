package com.cardapio.dto.produto;

import com.cardapio.entity.TipoProduto;
import com.cardapio.entity.UnidadeMedida;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

/**
 * Cadastro/edição de produto. Os campos que valem dependem do tipo (a obrigatoriedade é checada no service):
 * FINAL usa categoriaId, preco, imagemUrl, disponivel e composicao; INGREDIENTE usa custoUnitario e fornecedorId.
 * A composição enviada substitui, por completo, a que já existia (lista nula = não mexer).
 */
public record ProdutoCadastroRequest(
        @NotNull TipoProduto tipo,
        Boolean ativo,
        @Size(max = 50) String codigo,
        @NotBlank @Size(max = 255) String nome,
        @Size(max = 1000) String descricao,
        @NotNull UnidadeMedida unidadeMedida,
        @Size(max = 2000) String observacao,
        // produto final
        Long categoriaId,
        @PositiveOrZero BigDecimal preco,
        @Size(max = 255) String imagemUrl,
        Boolean disponivel,
        @Valid List<ItemComposicaoRequest> composicao,
        // ingrediente
        @PositiveOrZero BigDecimal custoUnitario,
        Long fornecedorId,
        @jakarta.validation.constraints.Positive Integer tempoPreparoMinutos,
        @PositiveOrZero BigDecimal precoPromocional,
        Boolean destaque,
        @Size(max = 20) String disponivelDias,
        java.time.LocalTime disponivelDas,
        java.time.LocalTime disponivelAte,
        @Size(max = 200) String selos,
        @Size(max = 300) String alergenos,
        @Size(max = 20) String promoDias,
        java.time.LocalTime promoInicio,
        java.time.LocalTime promoFim,
        java.util.List<Long> gruposOpcaoIds
) {

    /** Um ingrediente da composição e a quantidade dele (na unidade do ingrediente). */
    public record ItemComposicaoRequest(@NotNull Long ingredienteId, @NotNull @Positive BigDecimal quantidade) {
    }
}
