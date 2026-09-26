package com.cardapio.service;

import com.cardapio.dto.entregador.EntregaDtos.EntregadorEmRota;
import com.cardapio.dto.entregador.EntregaDtos.EntregasEmRota;
import com.cardapio.dto.entregador.EntregaDtos.LinhaRepasse;
import com.cardapio.dto.entregador.EntregaDtos.PedidoEmRota;
import com.cardapio.dto.entregador.EntregaDtos.Repasse;
import com.cardapio.entity.StatusPedido;
import com.cardapio.entity.T_Entregador;
import com.cardapio.entity.T_Pedido;
import com.cardapio.repository.T_EntregadorRepository;
import com.cardapio.repository.T_PedidoRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Visões de entrega para a loja: quem está na rua com quais pedidos e quanto cada entregador tem a receber. */
@Service
@RequiredArgsConstructor
public class EntregaAdminService {

    private static final List<StatusPedido> ABERTOS = List.of(
            StatusPedido.PENDENTE, StatusPedido.CONFIRMADO, StatusPedido.EM_PREPARO, StatusPedido.SAIU_PARA_ENTREGA);

    private final T_PedidoRepository pedidoRepository;
    private final T_EntregadorRepository entregadorRepository;
    private final FluxoPedidoService fluxoService;

    /** Pedidos de entrega em andamento, agrupados por entregador; os sem entregador vêm à parte. */
    @Transactional
    public EntregasEmRota emRota(UUID tenant) {
        var fluxo = fluxoService.carregar(tenant);
        List<T_Pedido> pedidos = pedidoRepository.buscarEntregasAbertas(tenant, ABERTOS);
        Map<Long, T_Entregador> entregadores = new HashMap<>();
        entregadorRepository.findByTenantAndIdIn(tenant, pedidos.stream().map(T_Pedido::getIdEntregador)
                .filter(java.util.Objects::nonNull).distinct().toList()).forEach(e -> entregadores.put(e.getId(), e));

        Map<Long, List<PedidoEmRota>> porEntregador = new LinkedHashMap<>();
        List<PedidoEmRota> semEntregador = new ArrayList<>();
        for (T_Pedido p : pedidos) {
            var situacao = fluxo.info(p);
            PedidoEmRota item = new PedidoEmRota(p.getId(), p.getNomeCliente(), p.getEnderecoBairro(),
                    situacao != null ? situacao.nome() : null, situacao != null ? situacao.cor() : null, p.getDataCriacao());
            if (p.getIdEntregador() == null || !entregadores.containsKey(p.getIdEntregador())) {
                semEntregador.add(item);
            } else {
                porEntregador.computeIfAbsent(p.getIdEntregador(), chave -> new ArrayList<>()).add(item);
            }
        }
        List<EntregadorEmRota> lista = porEntregador.entrySet().stream().map(e -> {
            T_Entregador ent = entregadores.get(e.getKey());
            return new EntregadorEmRota(ent.getId(), ent.getNome(), ent.getTipo().name(), ent.getUltimaLatitude(),
                    ent.getUltimaLongitude(), ent.getPosicaoEm(), e.getValue());
        }).toList();
        return new EntregasEmRota(lista, semEntregador);
    }

    /** Entregas concluídas e valor a repassar por entregador no período (máximo de 90 dias). */
    @Transactional(readOnly = true)
    public Repasse repasse(UUID tenant, LocalDate inicio, LocalDate fim) {
        PeriodoFiltro.validar(inicio, fim);
        List<Object[]> linhas = pedidoRepository.repassePorEntregador(tenant, inicio.atStartOfDay(), fim.plusDays(1).atStartOfDay());
        Map<Long, T_Entregador> entregadores = new HashMap<>();
        entregadorRepository.findByTenantAndIdIn(tenant, linhas.stream().map(l -> ((Number) l[0]).longValue()).toList())
                .forEach(e -> entregadores.put(e.getId(), e));
        long totalEntregas = 0;
        BigDecimal totalRepasse = BigDecimal.ZERO;
        List<LinhaRepasse> resultado = new ArrayList<>();
        for (Object[] l : linhas) {
            Long id = ((Number) l[0]).longValue();
            long entregas = ((Number) l[1]).longValue();
            BigDecimal repasse = (BigDecimal) l[2];
            T_Entregador ent = entregadores.get(id);
            resultado.add(new LinhaRepasse(id, ent != null ? ent.getNome() : "Entregador removido",
                    ent != null ? ent.getTipo().name() : null, entregas, repasse));
            totalEntregas += entregas;
            totalRepasse = totalRepasse.add(repasse);
        }
        resultado.sort((a, b) -> b.repasse().compareTo(a.repasse()));
        return new Repasse(resultado, totalEntregas, totalRepasse);
    }
}
