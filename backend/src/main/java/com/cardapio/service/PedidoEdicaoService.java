package com.cardapio.service;

import com.cardapio.dto.pedido.PedidoAdminResponse;
import com.cardapio.dto.pedido.PedidoEdicaoRequest;
import com.cardapio.dto.pedido.ItemPedidoRequest;
import com.cardapio.entity.I_ItemPedido;
import com.cardapio.entity.StatusPedido;
import com.cardapio.entity.T_Pedido;
import com.cardapio.entity.T_PedidoAlteracao;
import com.cardapio.entity.T_PedidoPagamento;
import com.cardapio.entity.T_Produto;
import com.cardapio.entity.TipoEntrega;
import com.cardapio.entity.TipoProduto;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.T_PedidoAlteracaoRepository;
import com.cardapio.repository.T_PedidoRepository;
import com.cardapio.repository.T_ProdutoRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Edição de pedido pela loja. Só pedidos ainda em andamento podem ser editados. Cada edição compara o antes e o
 * depois, grava o que mudou (histórico do pedido), marca o pedido como editado e avisa a cozinha.
 */
@Service
@RequiredArgsConstructor
public class PedidoEdicaoService {

    private final T_PedidoRepository pedidoRepository;
    private final T_ProdutoRepository produtoRepository;
    private final OpcaoService opcaoService;
    private final T_PedidoAlteracaoRepository alteracaoRepository;
    private final PedidoService pedidoService;
    private final PagamentoPedidoService pagamentoService;
    private final LojaService lojaService;
    private final NotificacaoService notificacaoService;
    private final ApplicationEventPublisher eventos;

    @Transactional
    public T_Pedido editar(UUID tenant, Long id, PedidoEdicaoRequest request, String usuarioNome) {
        T_Pedido pedido = pedidoRepository.buscarComItensPorId(id, tenant)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pedido não encontrado"));
        if (pedido.getStatus() == StatusPedido.ENTREGUE || pedido.getStatus() == StatusPedido.CANCELADO) {
            throw new RegraNegocioException("Pedido entregue ou cancelado não pode ser editado");
        }

        List<String> mudancas = new ArrayList<>();
        BigDecimal totalAntes = pedido.getTotal();

        // dados do cliente e da entrega
        comparar(mudancas, "Cliente", pedido.getNomeCliente(), request.nomeCliente().trim());
        comparar(mudancas, "Telefone", pedido.getTelefoneCliente(), request.telefoneCliente().trim());
        if (pedido.getTipoEntrega() != request.tipoEntrega()) {
            mudancas.add("Tipo: " + rotuloTipo(pedido.getTipoEntrega()) + " → " + rotuloTipo(request.tipoEntrega()));
        }
        boolean entrega = request.tipoEntrega() == TipoEntrega.ENTREGA;
        String enderecoAntes = endereco(pedido.getEnderecoRua(), pedido.getEnderecoNumero(), pedido.getEnderecoComplemento(),
                pedido.getEnderecoBairro(), pedido.getEnderecoCidade());
        String enderecoDepois = entrega ? endereco(request.enderecoRua(), request.enderecoNumero(),
                request.enderecoComplemento(), request.enderecoBairro(), request.enderecoCidade()) : "";
        if (!Objects.equals(enderecoAntes, enderecoDepois) && (entrega || !enderecoAntes.isEmpty())) {
            mudancas.add("Endereço: " + vazioComo(enderecoAntes, "sem endereço") + " → " + vazioComo(enderecoDepois, "sem endereço"));
        }
        if (!Objects.equals(vazioParaNulo(pedido.getObservacoes()), vazioParaNulo(request.observacoes()))) {
            mudancas.add("Observações do pedido alteradas");
        }

        pedido.setNomeCliente(request.nomeCliente().trim());
        pedido.setTelefoneCliente(request.telefoneCliente().trim());
        pedido.setTipoEntrega(request.tipoEntrega());
        pedido.setEnderecoRua(entrega ? vazioParaNulo(request.enderecoRua()) : null);
        pedido.setEnderecoNumero(entrega ? vazioParaNulo(request.enderecoNumero()) : null);
        pedido.setEnderecoComplemento(entrega ? vazioParaNulo(request.enderecoComplemento()) : null);
        pedido.setEnderecoBairro(entrega ? vazioParaNulo(request.enderecoBairro()) : null);
        pedido.setEnderecoCidade(entrega ? vazioParaNulo(request.enderecoCidade()) : null);
        pedido.setObservacoes(vazioParaNulo(request.observacoes()));

        // itens: quem já estava mantém o preço de quando o pedido foi feito; itens novos usam o preço de hoje
        Map<String, I_ItemPedido> existentes = new LinkedHashMap<>();
        pedido.getItens().forEach(item -> existentes.put(chaveDoItem(item), item));
        Map<String, ItemPedidoRequest> pedidos = new LinkedHashMap<>();
        for (ItemPedidoRequest item : request.itens()) {
            pedidos.merge(item.chave(), item, (a, b) -> new ItemPedidoRequest(a.produtoGuid(),
                    a.quantidade() + b.quantidade(), a.observacoes() != null ? a.observacoes() : b.observacoes(), a.opcoes()));
        }

        for (Map.Entry<String, I_ItemPedido> antigo : existentes.entrySet()) {
            if (!pedidos.containsKey(antigo.getKey())) {
                I_ItemPedido removido = antigo.getValue();
                mudancas.add("Removido: " + removido.getQuantidade() + "x " + removido.getNomeProduto());
                pedido.getItens().remove(removido);
            }
        }
        BigDecimal subtotal = BigDecimal.ZERO;
        for (ItemPedidoRequest novo : pedidos.values()) {
            I_ItemPedido item = existentes.get(novo.chave());
            if (item == null) {
                T_Produto produto = produtoRepository.findByGuidAndTenant(novo.produtoGuid(), tenant)
                        .orElseThrow(() -> new RecursoNaoEncontradoException("Produto não encontrado: " + novo.produtoGuid()));
                if (!produto.isAtivo() || !produto.isDisponivel() || produto.getTipo() != TipoProduto.FINAL) {
                    throw new RegraNegocioException("Produto indisponível: " + produto.getNome());
                }
                var escolhas = opcaoService.resolver(produto, novo.opcoes());
                item = I_ItemPedido.builder().tenant(tenant).pedido(pedido).produto(produto).nomeProduto(produto.getNome())
                        .precoUnitario(produto.precoVenda().add(escolhas.adicional())).quantidade(novo.quantidade())
                        .observacoes(vazioParaNulo(novo.observacoes())).build();
                final I_ItemPedido itemNovo = item;
                escolhas.opcoes().forEach(o -> {
                    o.setItem(itemNovo);
                    itemNovo.getOpcoes().add(o);
                });
                pedido.getItens().add(item);
                mudancas.add("Adicionado: " + novo.quantidade() + "x " + produto.getNome());
            } else {
                if (!item.getQuantidade().equals(novo.quantidade())) {
                    mudancas.add(item.getNomeProduto() + ": quantidade " + item.getQuantidade() + " → " + novo.quantidade());
                    item.setQuantidade(novo.quantidade());
                }
                if (!Objects.equals(vazioParaNulo(item.getObservacoes()), vazioParaNulo(novo.observacoes()))) {
                    mudancas.add(item.getNomeProduto() + ": observação alterada");
                    item.setObservacoes(vazioParaNulo(novo.observacoes()));
                }
            }
            item.setTotalItem(item.getPrecoUnitario().multiply(BigDecimal.valueOf(item.getQuantidade()))
                    .setScale(2, RoundingMode.HALF_UP));
            subtotal = subtotal.add(item.getTotalItem());
        }

        // valores: taxa de entrega e desconto
        BigDecimal taxaAntes = pedido.getTaxaEntrega();
        BigDecimal taxa = BigDecimal.ZERO;
        if (entrega) {
            if (request.taxaEntrega() != null) {
                if (request.taxaEntrega().signum() < 0) {
                    throw new RegraNegocioException("A taxa de entrega não pode ser negativa");
                }
                taxa = request.taxaEntrega().setScale(2, RoundingMode.HALF_UP);
            } else {
                taxa = taxaAntes;
            }
        }
        if (taxaAntes.compareTo(taxa) != 0) {
            mudancas.add("Taxa de entrega: " + moeda(taxaAntes) + " → " + moeda(taxa));
        }
        BigDecimal descontoAntes = pedido.getDesconto();
        BigDecimal desconto = pedidoService.valorDoDesconto(request.descontoTipo(), request.descontoValor(), subtotal);
        if (descontoAntes.compareTo(desconto) != 0) {
            mudancas.add("Desconto: " + moeda(descontoAntes) + " → " + moeda(desconto));
        }
        boolean comDesconto = desconto.signum() > 0;
        pedido.setDescontoTipo(comDesconto ? request.descontoTipo() : null);
        pedido.setDescontoValor(comDesconto ? request.descontoValor() : null);
        pedido.setDesconto(desconto);
        pedido.setSubtotal(subtotal);
        pedido.setTaxaEntrega(taxa);
        BigDecimal base = subtotal.subtract(desconto).add(taxa);

        // pagamento (dividido): a soma das partes tem de fechar com o valor do pedido; a taxa de cada forma entra no total
        List<T_PedidoPagamento> pagamentosAntes = pagamentoService.doPedido(pedido.getId());
        PagamentoPedidoService.Preparado pagamentos = pagamentoService.preparar(tenant, request.tipoEntrega(), request.pagamentos(), base);
        String pagamentoAntes = pagamentosAntes.isEmpty() ? vazioComo(pedido.getFormaPagamento(), "sem pagamento informado")
                : pagamentoService.descrever(pagamentosAntes);
        if (pagamentos.temPagamentos()) {
            String pagamentoDepois = pagamentoService.descrever(pagamentos.linhas());
            if (!pagamentoAntes.equals(pagamentoDepois)) {
                mudancas.add("Pagamento: " + pagamentoAntes + " → " + pagamentoDepois);
            }
            pedido.setFormaPagamento(pagamentos.nomes());
        } else {
            String textoLivre = vazioParaNulo(request.formaPagamento());
            if (!pagamentosAntes.isEmpty() && textoLivre == null) {
                mudancas.add("Pagamento: " + pagamentoAntes + " → sem pagamento informado");
            } else if (pagamentosAntes.isEmpty()) {
                comparar(mudancas, "Forma de pagamento", pedido.getFormaPagamento(), textoLivre);
            }
            pedido.setFormaPagamento(textoLivre);
        }
        if (pedido.getTaxaPagamentos().compareTo(pagamentos.taxaTotal()) != 0) {
            mudancas.add("Taxas de pagamento: " + moeda(pedido.getTaxaPagamentos()) + " → " + moeda(pagamentos.taxaTotal()));
        }
        pedido.setTaxaPagamentos(pagamentos.taxaTotal());
        pedido.setTotal(base.add(pagamentos.taxaTotal()));

        // prazo de preparo acompanha os itens
        int tempoAntes = pedido.getTempoPreparoMinutos() == null ? -1 : pedido.getTempoPreparoMinutos();
        int tempoDepois = pedidoService.tempoDePreparo(pedido.getItens().stream().map(I_ItemPedido::getProduto).toList(),
                lojaService.buscarPorTenant(tenant));
        if (tempoAntes >= 0 && tempoAntes != tempoDepois) {
            mudancas.add("Prazo de preparo: " + tempoAntes + " min → " + tempoDepois + " min");
        }
        pedido.setTempoPreparoMinutos(tempoDepois);

        if (mudancas.isEmpty()) {
            throw new RegraNegocioException("Nenhuma alteração para salvar");
        }
        if (totalAntes.compareTo(pedido.getTotal()) != 0) {
            mudancas.add("Total: " + moeda(totalAntes) + " → " + moeda(pedido.getTotal()));
        }

        pedido.setEditado(true);
        pedido.setDataEdicao(LocalDateTime.now().withNano(0));
        T_Pedido salvo = pedidoRepository.save(pedido);
        pagamentoService.persistir(salvo.getId(), tenant, pagamentos);

        T_PedidoAlteracao alteracao = new T_PedidoAlteracao();
        alteracao.setTenant(tenant);
        alteracao.setIdPedido(salvo.getId());
        alteracao.setUsuarioNome(usuarioNome);
        alteracao.setDescricoes(String.join("\n", mudancas));
        alteracaoRepository.save(alteracao);

        eventos.publishEvent(new PedidoEventos.PedidoEvento(tenant, "STATUS", salvo.getId()));
        notificacaoService.pedidoEditado(salvo, mudancas);
        return salvo;
    }

    private void comparar(List<String> mudancas, String campo, String antes, String depois) {
        if (!Objects.equals(vazioParaNulo(antes), vazioParaNulo(depois))) {
            mudancas.add(campo + ": " + vazioComo(antes, "vazio") + " → " + vazioComo(depois, "vazio"));
        }
    }

    private String vazioParaNulo(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }

    private String vazioComo(String valor, String alternativa) {
        return valor == null || valor.isBlank() ? alternativa : valor;
    }

    private String rotuloTipo(TipoEntrega tipo) {
        return tipo == TipoEntrega.ENTREGA ? "Entrega" : "Retirada";
    }

    /** Mesma chave das linhas do pedido enviado: produto + opções escolhidas. */
    private static String chaveDoItem(I_ItemPedido item) {
        return item.getProduto().getGuid() + "|" + item.getOpcoes().stream().map(o -> o.getIdOpcao()).filter(Objects::nonNull).sorted()
                .map(String::valueOf).collect(java.util.stream.Collectors.joining(","));
    }

    private String endereco(String rua, String numero, String complemento, String bairro, String cidade) {
        String ruaNumero = String.join(", ", java.util.stream.Stream.of(rua, numero)
                .filter(p -> p != null && !p.isBlank()).map(String::trim).toList());
        return String.join(" - ", java.util.stream.Stream.of(ruaNumero, complemento, bairro, cidade)
                .filter(p -> p != null && !p.isBlank()).map(String::trim).toList());
    }

    private String moeda(BigDecimal valor) {
        return NumberFormat.getCurrencyInstance(new Locale("pt", "BR")).format(valor);
    }
}
