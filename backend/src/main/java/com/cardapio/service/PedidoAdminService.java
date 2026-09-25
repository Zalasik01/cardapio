package com.cardapio.service;

import com.cardapio.dto.pedido.AtualizarStatusPedidoRequest;
import java.math.BigDecimal;
import com.cardapio.dto.pedido.PedidoRequest;
import com.cardapio.repository.T_ProdutoRepository;
import org.springframework.context.ApplicationEventPublisher;
import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.pedido.PedidoAdminResponse;
import com.cardapio.dto.pedido.PedidoAdminResumoResponse;
import com.cardapio.dto.pedido.PedidoPeriodoResumoResponse;
import com.cardapio.entity.StatusPedido;
import com.cardapio.entity.T_Pedido;
import com.cardapio.entity.TipoEntrega;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.T_PedidoRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/** Pedidos vistos pelo painel da loja: busca por período, detalhe, andamento (status) e o resumo do dashboard. */
@Service
@RequiredArgsConstructor
public class PedidoAdminService {

    private static final int TAMANHO_MAXIMO_PAGINA = 50;
    private static final List<StatusPedido> EM_ANDAMENTO = List.of(
            StatusPedido.PENDENTE, StatusPedido.CONFIRMADO, StatusPedido.EM_PREPARO, StatusPedido.SAIU_PARA_ENTREGA);

    private final T_PedidoRepository pedidoRepository;
    private final ApplicationEventPublisher eventos;
    private final PedidoService pedidoService;
    private final NotificacaoService notificacaoService;
    private final PedidoEdicaoService edicaoService;
    private final com.cardapio.repository.T_PedidoAlteracaoRepository alteracaoRepository;
    private final T_ProdutoRepository produtoRepository;

    /** Filtros da busca: o período (início e fim, no máximo 90 dias) é obrigatório; os demais são opcionais. */
    public record Filtro(String busca, StatusPedido status, TipoEntrega tipoEntrega, LocalDate inicio, LocalDate fim) {
    }

    @Transactional(readOnly = true)
    public PaginaResponse<PedidoAdminResumoResponse> buscar(UUID tenant, Filtro filtro, int pagina, int tamanho) {
        PeriodoFiltro.validar(filtro.inicio(), filtro.fim());
        int tamanhoLimitado = Math.min(Math.max(tamanho, 1), TAMANHO_MAXIMO_PAGINA);
        var resultado = pedidoRepository.findAll(especificacao(tenant, filtro),
                PageRequest.of(Math.max(pagina, 0), tamanhoLimitado));

        // quantidade de itens de cada pedido da página, numa consulta só
        Map<Long, Long> itens = new HashMap<>();
        List<Long> ids = resultado.getContent().stream().map(T_Pedido::getId).toList();
        if (!ids.isEmpty()) {
            pedidoRepository.somarItensPorPedido(ids).forEach(linha -> itens.put((Long) linha[0], ((Number) linha[1]).longValue()));
        }
        return PaginaResponse.of(resultado, p -> PedidoAdminResumoResponse.of(p, itens.getOrDefault(p.getId(), 0L)));
    }

    /** Quadro do painel: pedidos em andamento e os encerrados hoje, já com itens e próximos passos. */
    @Transactional(readOnly = true)
    public List<PedidoAdminResponse> quadro(UUID tenant) {
        List<T_Pedido> pedidos = pedidoRepository.buscarParaQuadro(tenant, EM_ANDAMENTO, LocalDate.now().atStartOfDay());
        // histórico dos clientes e alterações em consultas únicas (nada de uma consulta por pedido)
        Map<String, Long> historico = new HashMap<>();
        var telefones = pedidos.stream().map(T_Pedido::getTelefoneCliente).distinct().toList();
        if (!telefones.isEmpty()) {
            pedidoRepository.contarPedidosPorTelefone(tenant, telefones)
                    .forEach(linha -> historico.put((String) linha[0], ((Number) linha[1]).longValue()));
        }
        var idsEditados = pedidos.stream().filter(T_Pedido::isEditado).map(T_Pedido::getId).toList();
        Map<Long, List<PedidoAdminResponse.Alteracao>> alteracoes = new HashMap<>();
        if (!idsEditados.isEmpty()) {
            alteracaoRepository.findByIdPedidoInOrderByIdDesc(idsEditados).forEach(a -> alteracoes
                    .computeIfAbsent(a.getIdPedido(), chave -> new ArrayList<>()).add(PedidoAdminResponse.Alteracao.of(a)));
        }
        return pedidos.stream()
                .map(p -> PedidoAdminResponse.of(p, proximosStatus(p), historico.getOrDefault(p.getTelefoneCliente(), 1L),
                        alteracoes.getOrDefault(p.getId(), List.of())))
                .toList();
    }

    /** Produto que a loja pode lançar num pedido (produto final ativo e disponível). */
    public record ProdutoParaPedido(java.util.UUID guid, String nome, BigDecimal preco, String categoria) {
    }

    @Transactional(readOnly = true)
    public List<ProdutoParaPedido> produtosParaPedido(UUID tenant) {
        return produtoRepository.findByTenantOrderByOrdemExibicaoAsc(tenant).stream()
                .filter(produto -> produto.isAtivo() && produto.isDisponivel())
                .map(produto -> new ProdutoParaPedido(produto.getGuid(), produto.getNome(), produto.getPreco(),
                        produto.getCategoria() != null ? produto.getCategoria().getNome() : null))
                .toList();
    }

    /** Cria um pedido lançado pela loja; ele já chega ao painel (evento NOVO) como qualquer outro. */
    @Transactional
    public PedidoAdminResponse criar(UUID tenant, PedidoRequest request) {
        PedidoRequest daLoja = new PedidoRequest(tenant, request.nomeCliente(), request.telefoneCliente(),
                request.tipoEntrega(), request.enderecoRua(), request.enderecoNumero(), request.enderecoComplemento(),
                request.enderecoBairro(), request.enderecoCidade(), request.latitude(), request.longitude(),
                request.itens(), request.formaPagamento(), request.observacoes(), request.descontoTipo(), request.descontoValor(),
                request.taxaEntrega());
        T_Pedido pedido = pedidoService.criar(daLoja, true);
        return resposta(pedido);
    }

    @Transactional(readOnly = true)
    public PedidoAdminResponse obter(UUID tenant, Long id) {
        T_Pedido pedido = buscarPedido(tenant, id);
        return resposta(pedido);
    }

    /** Move o pedido para o próximo status (ou cancela). Só as transições de proximosStatus são aceitas. */
    @Transactional
    public PedidoAdminResponse atualizarStatus(UUID tenant, Long id, AtualizarStatusPedidoRequest request) {
        StatusPedido novoStatus = request.status();
        T_Pedido pedido = buscarPedido(tenant, id);
        if (!proximosStatus(pedido).contains(novoStatus)) {
            throw new RegraNegocioException("Este pedido não pode ir de " + pedido.getStatus() + " para " + novoStatus);
        }
        if (novoStatus == StatusPedido.CANCELADO) {
            // o motivo é opcional
            pedido.setMotivoCancelamento(request.motivo() == null || request.motivo().isBlank() ? null : request.motivo().trim());
            pedido.setTaxaCancelamento(request.taxaCancelamento() != null
                    ? request.taxaCancelamento().setScale(2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO);
        }
        pedido.setStatus(novoStatus);
        pedidoRepository.save(pedido);
        eventos.publishEvent(new PedidoEventos.PedidoEvento(tenant, "STATUS", pedido.getId()));
        return resposta(pedido);
    }

    /**
     * TEMPORÁRIO (teste das notificações): cria um pedido de retirada como se fosse de um cliente do cardápio, com o
     * primeiro produto disponível, e dispara a notificação de pedido novo. Remover junto com o botão do sino.
     */
    @Transactional
    public PedidoAdminResponse simularPedidoCliente(UUID tenant) {
        ProdutoParaPedido produto = produtosParaPedido(tenant).stream().findFirst()
                .orElseThrow(() -> new RegraNegocioException("Cadastre um produto final ativo para simular um pedido"));
        var item = new com.cardapio.dto.pedido.ItemPedidoRequest(produto.guid(), 2, null);
        var request = new PedidoRequest(tenant, "Cliente Teste", "11999990000", com.cardapio.entity.TipoEntrega.RETIRADA,
                null, null, null, null, null, null, null, List.of(item), "PIX", "Pedido de teste", null, null, null);
        T_Pedido pedido = pedidoService.criar(request, true);
        notificacaoService.pedidoNovo(pedido);
        return resposta(pedido);
    }

    /** Edita o pedido (itens, cliente, entrega, valores) e devolve o pedido já com o histórico de alterações. */
    @Transactional
    public PedidoAdminResponse editar(UUID tenant, Long id, com.cardapio.dto.pedido.PedidoEdicaoRequest request, String usuarioNome) {
        return resposta(edicaoService.editar(tenant, id, request, usuarioNome));
    }

    /** Exclusão lógica: o pedido some das listas, do painel e dos números do dashboard. */
    @Transactional
    public void excluir(UUID tenant, Long id) {
        T_Pedido pedido = buscarPedido(tenant, id);
        pedido.setDeletado(true);
        pedidoRepository.save(pedido);
        eventos.publishEvent(new PedidoEventos.PedidoEvento(tenant, "STATUS", id));
    }

    @Transactional(readOnly = true)
    public PedidoPeriodoResumoResponse resumo(UUID tenant, LocalDate inicio, LocalDate fim) {
        PeriodoFiltro.validar(inicio, fim);
        LocalDateTime de = inicio.atStartOfDay();
        LocalDateTime ate = fim.plusDays(1).atStartOfDay();
        return new PedidoPeriodoResumoResponse(
                pedidoRepository.contarNoPeriodo(tenant, de, ate),
                pedidoRepository.contarNoPeriodoPorStatus(tenant, de, ate, StatusPedido.ENTREGUE),
                pedidoRepository.somarNoPeriodoPorStatus(tenant, de, ate, StatusPedido.ENTREGUE),
                pedidoRepository.contarPorStatus(tenant, EM_ANDAMENTO));
    }

    /**
     * Fluxo: pendente, confirmado, em preparo, saiu para entrega (só entrega), entregue. Em qualquer ponto antes
     * do fim dá para cancelar. Entregue e cancelado são finais.
     */
    private List<StatusPedido> proximosStatus(T_Pedido pedido) {
        return switch (pedido.getStatus()) {
            case PENDENTE -> List.of(StatusPedido.CONFIRMADO, StatusPedido.CANCELADO);
            case CONFIRMADO -> List.of(StatusPedido.EM_PREPARO, StatusPedido.CANCELADO);
            case EM_PREPARO -> List.of(
                    pedido.getTipoEntrega() == TipoEntrega.ENTREGA ? StatusPedido.SAIU_PARA_ENTREGA : StatusPedido.ENTREGUE,
                    StatusPedido.CANCELADO);
            case SAIU_PARA_ENTREGA -> List.of(StatusPedido.ENTREGUE, StatusPedido.CANCELADO);
            case ENTREGUE, CANCELADO -> List.of();
        };
    }

    private PedidoAdminResponse resposta(T_Pedido pedido) {
        long total = pedidoRepository.contarPedidosDoTelefone(pedido.getTenant(), pedido.getTelefoneCliente());
        List<PedidoAdminResponse.Alteracao> alteracoes = alteracaoRepository.findByIdPedidoOrderByIdDesc(pedido.getId()).stream()
                .map(PedidoAdminResponse.Alteracao::of).toList();
        return PedidoAdminResponse.of(pedido, proximosStatus(pedido), total, alteracoes);
    }

    private T_Pedido buscarPedido(UUID tenant, Long id) {
        return pedidoRepository.buscarComItensPorId(id, tenant)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pedido não encontrado"));
    }

    private Specification<T_Pedido> especificacao(UUID tenant, Filtro filtro) {
        return (root, query, cb) -> {
            List<Predicate> filtros = new ArrayList<>();
            filtros.add(cb.equal(root.get("tenant"), tenant));
            filtros.add(cb.isFalse(root.get("deletado")));
            filtros.add(cb.greaterThanOrEqualTo(root.get("dataCriacao"), filtro.inicio().atStartOfDay()));
            filtros.add(cb.lessThan(root.get("dataCriacao"), filtro.fim().plusDays(1).atStartOfDay()));
            if (filtro.status() != null) {
                filtros.add(cb.equal(root.get("status"), filtro.status()));
            }
            if (filtro.tipoEntrega() != null) {
                filtros.add(cb.equal(root.get("tipoEntrega"), filtro.tipoEntrega()));
            }
            if (filtro.busca() != null && !filtro.busca().isBlank()) {
                String texto = filtro.busca().trim();
                String padrao = "%" + texto.toLowerCase(Locale.ROOT)
                        .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                List<Predicate> ou = new ArrayList<>(List.of(
                        cb.like(cb.lower(root.get("nomeCliente")), padrao, '\\'),
                        cb.like(root.get("telefoneCliente"), padrao, '\\')));
                if (texto.chars().allMatch(Character::isDigit) && texto.length() <= 12) {
                    ou.add(cb.equal(root.get("id"), Long.parseLong(texto))); // o número do pedido
                }
                filtros.add(cb.or(ou.toArray(new Predicate[0])));
            }
            if (query.getResultType() != Long.class) {
                query.orderBy(cb.desc(root.get("dataCriacao")));
            }
            return cb.and(filtros.toArray(new Predicate[0]));
        };
    }
}
