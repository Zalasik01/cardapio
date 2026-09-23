package com.cardapio.service;

import com.cardapio.dto.frete.CalculoFreteRequest;
import com.cardapio.dto.frete.CalculoFreteResponse;
import com.cardapio.dto.pedido.ItemPedidoRequest;
import com.cardapio.dto.pedido.PedidoRequest;
import com.cardapio.entity.*;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.PedidoRepository;
import com.cardapio.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ProdutoRepository produtoRepository;
    private final RestauranteService restauranteService;
    private final FreteService freteService;

    @Transactional
    public Pedido criar(PedidoRequest request) {
        Restaurante restaurante = restauranteService.buscarPorId(request.restauranteId());

        Pedido pedido = Pedido.builder()
                .restaurante(restaurante)
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
            Produto produto = produtoRepository.findById(itemRequest.produtoId())
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Produto nao encontrado: " + itemRequest.produtoId()));

            if (!produto.getRestaurante().getId().equals(restaurante.getId())) {
                throw new RegraNegocioException("Produto " + produto.getNome() + " nao pertence a este restaurante");
            }
            if (!produto.isDisponivel()) {
                throw new RegraNegocioException("Produto indisponivel: " + produto.getNome());
            }

            BigDecimal totalItem = produto.getPreco().multiply(BigDecimal.valueOf(itemRequest.quantidade()))
                    .setScale(2, RoundingMode.HALF_UP);

            ItemPedido item = ItemPedido.builder()
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

        if (subtotal.compareTo(restaurante.getValorMinimoPedido()) < 0) {
            throw new RegraNegocioException(
                    "Valor minimo do pedido e R$ " + restaurante.getValorMinimoPedido());
        }

        BigDecimal taxaEntrega = BigDecimal.ZERO;
        if (request.tipoEntrega() == TipoEntrega.ENTREGA) {
            CalculoFreteResponse frete = freteService.calcular(new CalculoFreteRequest(
                    restaurante.getId(), request.enderecoBairro(), request.latitude(), request.longitude()));

            if (!frete.entregavel()) {
                throw new RegraNegocioException(frete.mensagem());
            }
            taxaEntrega = frete.taxa();
        }

        pedido.setSubtotal(subtotal);
        pedido.setTaxaEntrega(taxaEntrega);
        pedido.setTotal(subtotal.add(taxaEntrega));

        return pedidoRepository.save(pedido);
    }

    @Transactional(readOnly = true)
    public Pedido buscarPorId(Long id) {
        return pedidoRepository.buscarComItensPorId(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pedido nao encontrado: " + id));
    }

    @Transactional(readOnly = true)
    public List<Pedido> listarPorRestaurante(Long restauranteId) {
        return pedidoRepository.buscarComItensPorRestaurante(restauranteId);
    }

    @Transactional(readOnly = true)
    public List<Pedido> listarPorCliente(Long clienteId) {
        return pedidoRepository.buscarComItensPorCliente(clienteId);
    }

    @Transactional
    public Pedido atualizarStatus(Long id, StatusPedido novoStatus) {
        Pedido pedido = buscarPorId(id);
        pedido.setStatus(novoStatus);
        return pedidoRepository.save(pedido);
    }
}
