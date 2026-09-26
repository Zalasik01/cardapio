package com.cardapio.dto.cupom;

import com.cardapio.entity.T_Cupom;
import com.cardapio.entity.TipoCupom;
import com.cardapio.entity.TipoEntrega;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public final class CupomDtos {

    private CupomDtos() {
    }

    /** Cadastro/edição de cupom. Campos vazios = sem restrição. */
    public record CupomRequest(
            @NotBlank @Size(max = 40) String codigo,
            @Size(max = 200) String descricao,
            @NotNull TipoCupom tipo,
            @PositiveOrZero BigDecimal valor,
            @PositiveOrZero BigDecimal valorMinimo,
            @PositiveOrZero BigDecimal descontoMaximo,
            LocalDateTime inicio,
            LocalDateTime fim,
            @Positive Integer limiteTotal,
            @Positive Integer limitePorCliente,
            Boolean primeiroPedido,
            TipoEntrega tipoEntrega,
            Long idCategoria,
            Boolean cumulativo,
            Boolean ativo
    ) {
    }

    public record CupomResponse(
            Long id,
            String codigo,
            String descricao,
            TipoCupom tipo,
            BigDecimal valor,
            BigDecimal valorMinimo,
            BigDecimal descontoMaximo,
            LocalDateTime inicio,
            LocalDateTime fim,
            Integer limiteTotal,
            Integer limitePorCliente,
            boolean primeiroPedido,
            TipoEntrega tipoEntrega,
            Long idCategoria,
            boolean cumulativo,
            boolean ativo,
            long usos
    ) {
        public static CupomResponse of(T_Cupom c, long usos) {
            return new CupomResponse(c.getId(), c.getCodigo(), c.getDescricao(), c.getTipo(), c.getValor(), c.getValorMinimo(),
                    c.getDescontoMaximo(), c.getInicio(), c.getFim(), c.getLimiteTotal(), c.getLimitePorCliente(),
                    c.isPrimeiroPedido(), c.getTipoEntrega(), c.getIdCategoria(), c.isCumulativo(), c.isAtivo(), usos);
        }
    }

    public record ItemCarrinho(@NotNull UUID produtoGuid, @Positive int quantidade) {
    }

    /** O que o checkout manda para conferir um cupom antes de enviar o pedido. */
    public record ValidarCupomRequest(
            @NotNull UUID tenant,
            @NotBlank String codigo,
            @NotNull TipoEntrega tipoEntrega,
            BigDecimal taxaEntrega,
            @NotEmpty @Valid List<ItemCarrinho> itens
    ) {
    }

    public record CupomAplicado(String codigo, String descricao, BigDecimal desconto) {
    }
}
