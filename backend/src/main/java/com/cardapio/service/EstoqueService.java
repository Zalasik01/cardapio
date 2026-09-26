package com.cardapio.service;

import com.cardapio.entity.I_ItemPedido;
import com.cardapio.entity.T_MovimentoEstoque;
import com.cardapio.entity.T_Pedido;
import com.cardapio.entity.T_Produto;
import com.cardapio.entity.TipoProduto;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.T_MovimentoEstoqueRepository;
import com.cardapio.repository.T_ProdutoIngredienteRepository;
import com.cardapio.repository.T_ProdutoRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Estoque de ingredientes: entrada por compra, perda, ajuste (contagem) e baixa automática quando um pedido entra
 * (pela composição dos produtos), com estorno no cancelamento. Só ingredientes com controle ligado movimentam.
 * O saldo pode ficar negativo (a venda nunca é barrada); o alerta aparece quando chega ao mínimo.
 */
@Service
@RequiredArgsConstructor
public class EstoqueService {

    private final T_ProdutoRepository produtoRepository;
    private final T_ProdutoIngredienteRepository composicaoRepository;
    private final T_MovimentoEstoqueRepository movimentoRepository;

    public record IngredienteEstoque(Long id, String nome, String unidade, boolean controla, BigDecimal atual, BigDecimal minimo,
                                     BigDecimal custoUnitario, boolean baixo) {
    }

    public record MovimentoResponse(Long id, String tipo, BigDecimal quantidade, BigDecimal saldoApos, String motivo, Long idPedido,
                                    LocalDateTime dataHora) {
    }

    public record ConfigRequest(boolean controla, BigDecimal minimo) {
    }

    public record LancamentoRequest(String tipo, BigDecimal quantidade, String motivo) {
    }

    @Transactional(readOnly = true)
    public List<IngredienteEstoque> listar(UUID tenant) {
        return produtoRepository.findByTenantOrderByOrdemExibicaoAsc(tenant).stream()
                .filter(p -> !p.isDeletado() && p.getTipo() == TipoProduto.INGREDIENTE)
                .map(this::resposta)
                .sorted((a, b) -> a.nome().compareToIgnoreCase(b.nome()))
                .toList();
    }

    @Transactional
    public IngredienteEstoque configurar(UUID tenant, Long id, ConfigRequest request) {
        T_Produto ingrediente = ingrediente(tenant, id);
        BigDecimal minimo = request.minimo() == null ? BigDecimal.ZERO : request.minimo();
        if (minimo.signum() < 0) {
            throw new RegraNegocioException("O estoque mínimo não pode ser negativo");
        }
        ingrediente.setControlaEstoque(request.controla());
        ingrediente.setEstoqueMinimo(minimo);
        return resposta(produtoRepository.save(ingrediente));
    }

    @Transactional
    public IngredienteEstoque lancar(UUID tenant, Long id, LancamentoRequest request) {
        T_Produto ingrediente = ingrediente(tenant, id);
        String tipo = request.tipo() == null ? "" : request.tipo();
        if (request.quantidade() == null || request.quantidade().signum() < 0
                || (request.quantidade().signum() == 0 && !T_MovimentoEstoque.AJUSTE.equals(tipo))) {
            throw new RegraNegocioException("Informe uma quantidade maior que zero");
        }
        BigDecimal delta = switch (tipo) {
            case T_MovimentoEstoque.ENTRADA -> request.quantidade();
            case T_MovimentoEstoque.PERDA -> request.quantidade().negate();
            case T_MovimentoEstoque.AJUSTE -> request.quantidade().subtract(ingrediente.getEstoqueAtual()); // contagem: define o saldo
            default -> throw new RegraNegocioException("Tipo de movimento inválido");
        };
        // lançar um movimento liga o controle: o ingrediente passa a ser acompanhado
        ingrediente.setControlaEstoque(true);
        movimentar(ingrediente, tipo, delta, request.motivo(), null);
        return resposta(ingrediente);
    }

    @Transactional(readOnly = true)
    public List<MovimentoResponse> historico(UUID tenant, Long id) {
        ingrediente(tenant, id);
        return movimentoRepository.findByTenantAndIngredienteIdOrderByDataHoraDescIdDesc(tenant, id, PageRequest.of(0, 100)).stream()
                .map(m -> new MovimentoResponse(m.getId(), m.getTipo(), m.getQuantidade(), m.getSaldoApos(), m.getMotivo(), m.getIdPedido(), m.getDataHora()))
                .toList();
    }

    /** Quantos ingredientes controlados estão no mínimo ou abaixo. */
    @Transactional(readOnly = true)
    public long contarAbaixoDoMinimo(UUID tenant) {
        return listar(tenant).stream().filter(IngredienteEstoque::baixo).count();
    }

    /** Dá baixa nos ingredientes controlados pelo que o pedido leva (composição x quantidade). */
    @Transactional
    public void baixarPedido(T_Pedido pedido) {
        Map<Long, BigDecimal> consumo = new LinkedHashMap<>();
        Map<Long, T_Produto> ingredientes = new LinkedHashMap<>();
        for (I_ItemPedido item : pedido.getItens()) {
            if (item.getProduto() == null) {
                continue;
            }
            composicaoRepository.findByProdutoIdOrderByIdAsc(item.getProduto().getId()).forEach(c -> {
                T_Produto ing = c.getIngrediente();
                if (ing.isControlaEstoque()) {
                    ingredientes.put(ing.getId(), ing);
                    consumo.merge(ing.getId(), c.getQuantidade().multiply(BigDecimal.valueOf(item.getQuantidade())), BigDecimal::add);
                }
            });
        }
        consumo.forEach((id, qtd) -> movimentar(ingredientes.get(id), T_MovimentoEstoque.BAIXA, qtd.negate(), "Pedido #" + pedido.getId(), pedido.getId()));
    }

    /** Devolve ao estoque o que o pedido cancelado tinha baixado (uma vez só). */
    @Transactional
    public void estornarPedido(T_Pedido pedido) {
        if (!movimentoRepository.findByIdPedidoAndTipo(pedido.getId(), T_MovimentoEstoque.ESTORNO).isEmpty()) {
            return;
        }
        for (T_MovimentoEstoque baixa : movimentoRepository.findByIdPedidoAndTipo(pedido.getId(), T_MovimentoEstoque.BAIXA)) {
            movimentar(baixa.getIngrediente(), T_MovimentoEstoque.ESTORNO, baixa.getQuantidade().negate(),
                    "Cancelamento do pedido #" + pedido.getId(), pedido.getId());
        }
    }

    private void movimentar(T_Produto ingrediente, String tipo, BigDecimal delta, String motivo, Long idPedido) {
        BigDecimal saldo = ingrediente.getEstoqueAtual().add(delta);
        ingrediente.setEstoqueAtual(saldo);
        produtoRepository.save(ingrediente);
        movimentoRepository.save(T_MovimentoEstoque.builder()
                .guid(UUID.randomUUID()).tenant(ingrediente.getTenant()).ingrediente(ingrediente).tipo(tipo).quantidade(delta)
                .saldoApos(saldo).motivo(motivo == null || motivo.isBlank() ? null : motivo.trim()).idPedido(idPedido)
                .dataHora(LocalDateTime.now()).build());
    }

    private T_Produto ingrediente(UUID tenant, Long id) {
        T_Produto p = produtoRepository.findByIdAndTenantAndDeletadoFalse(id, tenant)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Ingrediente não encontrado"));
        if (p.getTipo() != TipoProduto.INGREDIENTE) {
            throw new RegraNegocioException("O estoque é controlado só para ingredientes");
        }
        return p;
    }

    private IngredienteEstoque resposta(T_Produto p) {
        boolean baixo = p.isControlaEstoque() && p.getEstoqueAtual().compareTo(p.getEstoqueMinimo()) <= 0;
        return new IngredienteEstoque(p.getId(), p.getNome(), p.getUnidadeMedida() == null ? "UN" : p.getUnidadeMedida().name(),
                p.isControlaEstoque(), p.getEstoqueAtual(), p.getEstoqueMinimo(), p.getCustoUnitario(), baixo);
    }
}
