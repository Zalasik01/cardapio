package com.cardapio.service;

import org.springframework.context.ApplicationEventPublisher;
import com.cardapio.dto.frete.CalculoFreteRequest;
import com.cardapio.dto.frete.CalculoFreteResponse;
import com.cardapio.dto.pedido.ItemPedidoRequest;
import com.cardapio.dto.pedido.PedidoRequest;
import com.cardapio.entity.*;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.T_PedidoRepository;
import com.cardapio.repository.T_ProdutoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private final T_PedidoRepository pedidoRepository;
    private final T_ProdutoRepository produtoRepository;
    private final LojaService lojaService;
    private final FreteService freteService;
    private final FuncionamentoService funcionamentoService;
    private final ApplicationEventPublisher eventos;

    /** Pedido feito pelo cliente no cardápio: respeita o horário de funcionamento e o valor mínimo. */
    @Transactional
    public T_Pedido criar(PedidoRequest request) {
        return criar(request, false);
    }

    /**
     * pelaLoja: pedido lançado pela própria loja (balcão, telefone, WhatsApp); não depende de a loja estar
     * aberta nem do valor mínimo do pedido.
     */
    @Transactional
    public T_Pedido criar(PedidoRequest request, boolean pelaLoja) {
        S_Loja loja = lojaService.buscarPorTenant(request.tenant());
        UUID tenant = loja.getGuid();
        if (!pelaLoja && !funcionamentoService.estaAberta(loja)) {
            throw new RegraNegocioException("A loja está fechada no momento. Confira o horário de funcionamento.");
        }

        T_Pedido pedido = T_Pedido.builder()
                .tenant(tenant)
                .nomeCliente(request.nomeCliente())
                .telefoneCliente(request.telefoneCliente())
                .tipoEntrega(request.tipoEntrega())
                .enderecoRua(request.enderecoRua())
                .enderecoNumero(request.enderecoNumero())
                .enderecoComplemento(request.enderecoComplemento())
                .enderecoBairro(request.enderecoBairro())
                .enderecoCidade(request.enderecoCidade())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .formaPagamento(request.formaPagamento())
                .observacoes(request.observacoes())
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;
        for (ItemPedidoRequest itemRequest : request.itens()) {
            T_Produto produto = produtoRepository.findByGuidAndTenant(itemRequest.produtoGuid(), tenant)
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Produto não encontrado: " + itemRequest.produtoGuid()));

            if (!produto.isAtivo() || !produto.isDisponivel() || produto.getTipo() != com.cardapio.entity.TipoProduto.FINAL) {
                throw new RegraNegocioException("Produto indisponível: " + produto.getNome());
            }

            BigDecimal totalItem = produto.getPreco().multiply(BigDecimal.valueOf(itemRequest.quantidade()))
                    .setScale(2, RoundingMode.HALF_UP);

            I_ItemPedido item = I_ItemPedido.builder()
                    .tenant(tenant)
                    .pedido(pedido)
                    .produto(produto)
                    .nomeProduto(produto.getNome())
                    .precoUnitario(produto.getPreco())
                    .quantidade(itemRequest.quantidade())
                    .totalItem(totalItem)
                    .observacoes(itemRequest.observacoes())
                    .build();

            pedido.getItens().add(item);
            subtotal = subtotal.add(totalItem);
        }

        if (!pelaLoja && subtotal.compareTo(loja.getValorMinimoPedido()) < 0) {
            throw new RegraNegocioException("Valor mínimo do pedido é R$ " + loja.getValorMinimoPedido());
        }

        BigDecimal taxaEntrega = BigDecimal.ZERO;
        if (request.tipoEntrega() == TipoEntrega.ENTREGA && pelaLoja && request.taxaEntrega() != null) {
            // a loja pode informar a taxa na mão (ex.: bairro sem zona cadastrada)
            if (request.taxaEntrega().signum() < 0) {
                throw new RegraNegocioException("A taxa de entrega não pode ser negativa");
            }
            taxaEntrega = request.taxaEntrega().setScale(2, RoundingMode.HALF_UP);
        } else if (request.tipoEntrega() == TipoEntrega.ENTREGA) {
            CalculoFreteResponse frete = freteService.calcular(new CalculoFreteRequest(
                    tenant, request.enderecoBairro(), request.latitude(), request.longitude()));

            if (!frete.entregavel()) {
                throw new RegraNegocioException(frete.mensagem());
            }
            taxaEntrega = frete.taxa();
        }

        BigDecimal desconto = pelaLoja ? calcularDesconto(request, subtotal, pedido) : BigDecimal.ZERO;

        pedido.setSubtotal(subtotal);
        pedido.setTaxaEntrega(taxaEntrega);
        pedido.setDesconto(desconto);
        pedido.setTotal(subtotal.subtract(desconto).add(taxaEntrega));

        T_Pedido salvo = pedidoRepository.save(pedido);
        eventos.publishEvent(new PedidoEventos.PedidoEvento(tenant, "NOVO", salvo.getId()));
        return salvo;
    }

    /** Desconto da loja sobre os itens: percentual (0 a 100) ou valor fixo, nunca maior que o subtotal. */
    private BigDecimal calcularDesconto(PedidoRequest request, BigDecimal subtotal, T_Pedido pedido) {
        if (request.descontoTipo() == null || request.descontoValor() == null
                || request.descontoValor().signum() <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal desconto;
        switch (request.descontoTipo()) {
            case "PERCENTUAL" -> {
                if (request.descontoValor().compareTo(BigDecimal.valueOf(100)) > 0) {
                    throw new RegraNegocioException("O desconto percentual não pode passar de 100%");
                }
                desconto = subtotal.multiply(request.descontoValor()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            }
            case "VALOR" -> desconto = request.descontoValor().setScale(2, RoundingMode.HALF_UP);
            default -> throw new RegraNegocioException("Tipo de desconto inválido");
        }
        if (desconto.compareTo(subtotal) > 0) {
            throw new RegraNegocioException("O desconto não pode ser maior que o valor dos itens");
        }
        pedido.setDescontoTipo(request.descontoTipo());
        pedido.setDescontoValor(request.descontoValor());
        return desconto;
    }

    @Transactional(readOnly = true)
    public T_Pedido buscarPorGuid(UUID guid) {
        return pedidoRepository.buscarComItensPorGuid(guid)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pedido não encontrado: " + guid));
    }
}
