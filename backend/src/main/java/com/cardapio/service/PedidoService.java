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
    private final NotificacaoService notificacaoService;
    private final FluxoPedidoService fluxoService;
    private final PagamentoPedidoService pagamentoService;
    private final CupomService cupomService;
    private final ClientePessoaService clientePessoaService;

    /** Pedido feito pelo cliente no cardápio: respeita o horário de funcionamento e o valor mínimo. */
    @Transactional
    public T_Pedido criar(PedidoRequest request) {
        return criar(request, false, null);
    }

    /** Pedido do cliente logado: o telefone é o da conta (confirmado por OTP) e o pedido fica no histórico dela. */
    @Transactional
    public T_Pedido criarParaCliente(PedidoRequest request, com.cardapio.entity.S_ClienteConta conta) {
        PedidoRequest daConta = new PedidoRequest(request.tenant(), request.nomeCliente(), conta.getTelefone(),
                request.tipoEntrega(), request.enderecoRua(), request.enderecoNumero(), request.enderecoComplemento(),
                request.enderecoBairro(), request.enderecoCidade(), request.latitude(), request.longitude(),
                request.itens(), request.formaPagamento(), request.observacoes(), null, null, null, null, request.codigoCupom());
        return criar(daConta, false, conta);
    }

    /**
     * pelaLoja: pedido lançado pela própria loja (balcão, telefone, WhatsApp); não depende de a loja estar
     * aberta nem do valor mínimo do pedido.
     */
    @Transactional
    public T_Pedido criar(PedidoRequest request, boolean pelaLoja) {
        return criar(request, pelaLoja, null);
    }

    /** conta: cliente logado do cardápio online (vazio nos pedidos lançados pela loja); é ela que usa cupom. */
    @Transactional
    public T_Pedido criar(PedidoRequest request, boolean pelaLoja, com.cardapio.entity.S_ClienteConta conta) {
        S_Loja loja = lojaService.buscarPorTenant(request.tenant());
        UUID tenant = loja.getGuid();
        if (!pelaLoja && !funcionamentoService.estaAberta(loja)) {
            throw new RegraNegocioException("A loja está fechada no momento. Confira o horário de funcionamento.");
        }

        java.time.LocalDateTime agoraNaLoja = java.time.LocalDateTime.now(java.time.ZoneId.of(loja.getFusoHorario()));
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
        List<T_Produto> produtosDoPedido = new java.util.ArrayList<>();
        List<CupomService.ItemAvaliacao> itensAvaliacao = new java.util.ArrayList<>();
        for (ItemPedidoRequest itemRequest : request.itens()) {
            T_Produto produto = produtoRepository.findByGuidAndTenant(itemRequest.produtoGuid(), tenant)
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Produto não encontrado: " + itemRequest.produtoGuid()));

            if (!produto.isAtivo() || !produto.isDisponivel() || produto.getTipo() != com.cardapio.entity.TipoProduto.FINAL) {
                throw new RegraNegocioException("Produto indisponível: " + produto.getNome());
            }
            if (!pelaLoja && !produto.vendavelAgora(agoraNaLoja)) {
                throw new RegraNegocioException(produto.esgotado(agoraNaLoja) ? "Esgotado hoje: " + produto.getNome()
                        : "Fora do horário de venda: " + produto.getNome());
            }

            BigDecimal totalItem = produto.precoVenda(agoraNaLoja).multiply(BigDecimal.valueOf(itemRequest.quantidade()))
                    .setScale(2, RoundingMode.HALF_UP);

            I_ItemPedido item = I_ItemPedido.builder()
                    .tenant(tenant)
                    .pedido(pedido)
                    .produto(produto)
                    .nomeProduto(produto.getNome())
                    .precoUnitario(produto.precoVenda(agoraNaLoja))
                    .quantidade(itemRequest.quantidade())
                    .totalItem(totalItem)
                    .observacoes(itemRequest.observacoes())
                    .build();

            pedido.getItens().add(item);
            produtosDoPedido.add(produto);
            itensAvaliacao.add(new CupomService.ItemAvaliacao(produto, itemRequest.quantidade()));
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
        CupomService.Resultado cupom = null;
        if (!pelaLoja && conta != null && request.codigoCupom() != null && !request.codigoCupom().isBlank()) {
            // o servidor confere o cupom de novo: o valor mostrado no checkout nunca é confiado
            cupom = cupomService.avaliar(tenant, request.codigoCupom(), conta, request.tipoEntrega(), itensAvaliacao, taxaEntrega);
            desconto = cupom.desconto();
            pedido.setCodigoCupom(cupom.cupom().getCodigo());
        }
        if (conta != null) {
            pedido.setIdClienteConta(conta.getId());
        }
        if (request.tipoEntrega() == TipoEntrega.ENTREGA) {
            pedido.setCodigoEntrega(String.format("%04d", new java.security.SecureRandom().nextInt(10000)));
        }

        pedido.setSubtotal(subtotal);
        pedido.setTaxaEntrega(taxaEntrega);
        pedido.setDesconto(desconto);
        BigDecimal base = subtotal.subtract(desconto).add(taxaEntrega);
        // pagamento dividido (pedidos lançados pela loja): a taxa de cada forma entra no total
        var pagamentos = pelaLoja ? pagamentoService.preparar(tenant, request.tipoEntrega(), request.pagamentos(), base)
                : PagamentoPedidoService.Preparado.vazio();
        pedido.setTaxaPagamentos(pagamentos.taxaTotal());
        if (pagamentos.temPagamentos()) {
            pedido.setFormaPagamento(pagamentos.nomes());
        }
        pedido.setTotal(base.add(pagamentos.taxaTotal()));
        pedido.setTempoPreparoMinutos(tempoDePreparo(produtosDoPedido, loja));

        // todo pedido novo entra na situação inicial do fluxo da loja
        var inicial = fluxoService.carregar(tenant).inicial();
        pedido.setIdSituacao(inicial.getId());
        pedido.setStatus(inicial.getCategoria());
        T_Pedido salvo = pedidoRepository.save(pedido);
        if (conta != null) {
            // primeiro pedido nesta loja: garante o cliente em Clientes e Fornecedores (com o nome digitado no pedido)
            clientePessoaService.garantir(tenant, conta, request.nomeCliente());
        }
        if (cupom != null) {
            cupomService.registrarUso(cupom.cupom(), salvo.getId(), conta.getId(), cupom.desconto());
        }
        if (pagamentos.temPagamentos()) {
            pagamentoService.persistir(salvo.getId(), tenant, pagamentos);
        }
        eventos.publishEvent(new PedidoEventos.PedidoEvento(tenant, "NOVO", salvo.getId()));
        if (!pelaLoja) {
            notificacaoService.pedidoNovo(salvo);
        }
        return salvo;
    }

    /** Prazo de preparo do pedido: o maior tempo entre os itens (produto, senão categoria, senão o padrão da loja). */
    public int tempoDePreparo(java.util.Collection<T_Produto> produtos, S_Loja loja) {
        int padrao = loja.getTempoPreparoPadraoMinutos() != null ? loja.getTempoPreparoPadraoMinutos() : 30;
        return produtos.stream().mapToInt(p -> {
            if (p.getTempoPreparoMinutos() != null) {
                return p.getTempoPreparoMinutos();
            }
            if (p.getCategoria() != null && p.getCategoria().getTempoPreparoMinutos() != null) {
                return p.getCategoria().getTempoPreparoMinutos();
            }
            return padrao;
        }).max().orElse(padrao);
    }

    /** Valor do desconto (em reais) para o tipo e o valor informados; 0 quando não há desconto. */
    public BigDecimal valorDoDesconto(String tipo, BigDecimal valor, BigDecimal subtotal) {
        if (tipo == null || valor == null || valor.signum() <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal desconto;
        switch (tipo) {
            case "PERCENTUAL" -> {
                if (valor.compareTo(BigDecimal.valueOf(100)) > 0) {
                    throw new RegraNegocioException("O desconto percentual não pode passar de 100%");
                }
                desconto = subtotal.multiply(valor).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            }
            case "VALOR" -> desconto = valor.setScale(2, RoundingMode.HALF_UP);
            default -> throw new RegraNegocioException("Tipo de desconto inválido");
        }
        if (desconto.compareTo(subtotal) > 0) {
            throw new RegraNegocioException("O desconto não pode ser maior que o valor dos itens");
        }
        return desconto;
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
