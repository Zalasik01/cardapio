package com.cardapio.service;

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

    @Transactional
    public T_Pedido criar(PedidoRequest request) {
        S_Loja loja = lojaService.buscarPorTenant(request.tenant());
        UUID tenant = loja.getGuid();

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

            if (!produto.isDisponivel()) {
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

        if (subtotal.compareTo(loja.getValorMinimoPedido()) < 0) {
            throw new RegraNegocioException("Valor mínimo do pedido é R$ " + loja.getValorMinimoPedido());
        }

        BigDecimal taxaEntrega = BigDecimal.ZERO;
        if (request.tipoEntrega() == TipoEntrega.ENTREGA) {
            CalculoFreteResponse frete = freteService.calcular(new CalculoFreteRequest(
                    tenant, request.enderecoBairro(), request.latitude(), request.longitude()));

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
    public T_Pedido buscarPorGuid(UUID guid) {
        return pedidoRepository.buscarComItensPorGuid(guid)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pedido não encontrado: " + guid));
    }

    @Transactional(readOnly = true)
    public List<T_Pedido> listarPorTenant(UUID tenant) {
        return pedidoRepository.buscarComItensPorTenant(tenant);
    }

    @Transactional(readOnly = true)
    public List<T_Pedido> listarPorCliente(Long clienteId) {
        return pedidoRepository.buscarComItensPorCliente(clienteId);
    }

    @Transactional
    public T_Pedido atualizarStatus(UUID guid, StatusPedido novoStatus) {
        T_Pedido pedido = buscarPorGuid(guid);
        pedido.setStatus(novoStatus);
        return pedidoRepository.save(pedido);
    }
}
