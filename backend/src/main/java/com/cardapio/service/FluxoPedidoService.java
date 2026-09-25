package com.cardapio.service;

import com.cardapio.dto.pedido.FluxoDtos.FluxoRequest;
import com.cardapio.dto.pedido.FluxoDtos.FluxoResponse;
import com.cardapio.dto.pedido.FluxoDtos.ProximaSituacao;
import com.cardapio.dto.pedido.FluxoDtos.SituacaoInfo;
import com.cardapio.dto.pedido.FluxoDtos.SituacaoRequest;
import com.cardapio.dto.pedido.FluxoDtos.SituacaoResponse;
import com.cardapio.dto.pedido.FluxoDtos.TransicaoRequest;
import com.cardapio.dto.pedido.FluxoDtos.TransicaoResponse;
import com.cardapio.entity.StatusPedido;
import com.cardapio.entity.T_Pedido;
import com.cardapio.entity.T_SituacaoPedido;
import com.cardapio.entity.T_TransicaoPedido;
import com.cardapio.entity.TipoEntrega;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.T_PedidoRepository;
import com.cardapio.repository.T_SituacaoPedidoRepository;
import com.cardapio.repository.T_TransicaoPedidoRepository;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Fluxo de pedidos da loja: as situações (colunas do kanban) e para onde cada uma pode ir. Toda loja começa com o
 * fluxo padrão (o de sempre), criado na primeira vez que é usado, e pode personalizar. A categoria de cada situação
 * (StatusPedido) é o que dashboards, notificações e relatórios entendem, seja qual for o nome dado pela loja.
 */
@Service
@RequiredArgsConstructor
public class FluxoPedidoService {

    private static final List<StatusPedido> FINAIS = List.of(StatusPedido.ENTREGUE, StatusPedido.CANCELADO);
    private static final List<StatusPedido> ABERTOS = List.of(
            StatusPedido.PENDENTE, StatusPedido.CONFIRMADO, StatusPedido.EM_PREPARO, StatusPedido.SAIU_PARA_ENTREGA);

    private final T_SituacaoPedidoRepository situacaoRepository;
    private final T_TransicaoPedidoRepository transicaoRepository;
    private final T_PedidoRepository pedidoRepository;

    /** Evita criar o fluxo padrão duas vezes se duas requisições da mesma loja chegarem juntas. */
    private final Map<UUID, Object> travas = new ConcurrentHashMap<>();

    /** Fluxo da loja carregado na memória, com as consultas que o painel precisa. */
    public static final class Fluxo {
        private final List<T_SituacaoPedido> situacoes;
        private final List<T_TransicaoPedido> transicoes;

        Fluxo(List<T_SituacaoPedido> situacoes, List<T_TransicaoPedido> transicoes) {
            this.situacoes = situacoes;
            this.transicoes = transicoes;
        }

        public List<T_SituacaoPedido> situacoes() {
            return situacoes;
        }

        public T_SituacaoPedido porId(Long id) {
            return situacoes.stream().filter(s -> s.getId().equals(id)).findFirst().orElse(null);
        }

        /** Onde todo pedido novo entra: a primeira situação ativa. */
        public T_SituacaoPedido inicial() {
            return situacoes.stream().filter(T_SituacaoPedido::isAtivo).findFirst().orElseThrow();
        }

        public T_SituacaoPedido cancelamento() {
            return situacoes.stream().filter(s -> s.isAtivo() && s.getCategoria() == StatusPedido.CANCELADO)
                    .findFirst().orElseThrow();
        }

        /** Situação atual do pedido (pedidos antigos, sem situação gravada, usam a primeira da mesma categoria). */
        public T_SituacaoPedido atual(T_Pedido pedido) {
            T_SituacaoPedido gravada = pedido.getIdSituacao() == null ? null : porId(pedido.getIdSituacao());
            if (gravada != null) {
                return gravada;
            }
            return situacoes.stream().filter(s -> s.getCategoria() == pedido.getStatus()).findFirst().orElse(null);
        }

        public SituacaoInfo info(T_Pedido pedido) {
            T_SituacaoPedido atual = atual(pedido);
            return atual == null ? null : new SituacaoInfo(atual.getId(), atual.getNome(), atual.getCor(), atual.getCategoria());
        }

        /** Para onde o pedido pode ir agora: as transições da situação atual (para o tipo do pedido) e cancelar. */
        public List<ProximaSituacao> proximas(T_Pedido pedido) {
            T_SituacaoPedido atual = atual(pedido);
            if (atual == null || FINAIS.contains(atual.getCategoria())) {
                return List.of();
            }
            List<ProximaSituacao> resultado = new ArrayList<>();
            for (T_TransicaoPedido t : transicoes) {
                if (!t.getIdDe().equals(atual.getId())
                        || (t.getTipoPedido() != null && t.getTipoPedido() != pedido.getTipoEntrega())) {
                    continue;
                }
                T_SituacaoPedido destino = porId(t.getIdPara());
                if (destino != null && destino.isAtivo() && destino.getCategoria() != StatusPedido.CANCELADO) {
                    String rotulo = t.getRotulo() == null || t.getRotulo().isBlank() ? destino.getNome() : t.getRotulo();
                    resultado.add(new ProximaSituacao(destino.getId(), destino.getNome(), destino.getCor(), destino.getCategoria(), rotulo));
                }
            }
            T_SituacaoPedido cancelar = cancelamento();
            resultado.add(new ProximaSituacao(cancelar.getId(), cancelar.getNome(), cancelar.getCor(), cancelar.getCategoria(),
                    "Cancelar pedido"));
            return resultado;
        }
    }

    /** Fluxo da loja (cria o padrão na primeira vez). */
    @Transactional
    public Fluxo carregar(UUID tenant) {
        List<T_SituacaoPedido> situacoes = situacaoRepository.findByTenantAndDeletadoFalseOrderByOrdemAscIdAsc(tenant);
        if (situacoes.isEmpty()) {
            synchronized (travas.computeIfAbsent(tenant, chave -> new Object())) {
                situacoes = situacaoRepository.findByTenantAndDeletadoFalseOrderByOrdemAscIdAsc(tenant);
                if (situacoes.isEmpty()) {
                    criarPadrao(tenant);
                    situacoes = situacaoRepository.findByTenantAndDeletadoFalseOrderByOrdemAscIdAsc(tenant);
                }
            }
        }
        return new Fluxo(situacoes, transicaoRepository.findByTenantAndDeletadoFalse(tenant));
    }

    @Transactional
    public FluxoResponse obter(UUID tenant) {
        Fluxo fluxo = carregar(tenant);
        Map<Long, Long> abertos = new HashMap<>();
        pedidoRepository.contarAbertosPorSituacao(tenant, ABERTOS)
                .forEach(linha -> abertos.put((Long) linha[0], ((Number) linha[1]).longValue()));
        List<SituacaoResponse> situacoes = new ArrayList<>();
        int ordem = 0;
        for (T_SituacaoPedido s : fluxo.situacoes()) {
            situacoes.add(new SituacaoResponse(s.getId(), s.getNome(), s.getCor(), s.getCategoria(), ordem++, s.isAtivo(),
                    s.getCategoria() == StatusPedido.CANCELADO, abertos.getOrDefault(s.getId(), 0L)));
        }
        List<TransicaoResponse> transicoes = fluxo.transicoes.stream()
                .map(t -> new TransicaoResponse(t.getIdDe(), t.getIdPara(), t.getTipoPedido(), t.getRotulo())).toList();
        return new FluxoResponse(situacoes, transicoes);
    }

    /** Salva o fluxo inteiro (situações na ordem da lista e as transições), conferindo as regras do sistema. */
    @Transactional
    public FluxoResponse salvar(UUID tenant, FluxoRequest request) {
        Fluxo atual = carregar(tenant);
        List<SituacaoRequest> pedidas = request.situacoes();
        List<TransicaoRequest> transicoesPedidas = request.transicoes() == null ? List.of() : request.transicoes();

        validar(pedidas, transicoesPedidas);

        // situações existentes que sumiram da lista são removidas, desde que não tenham pedido em andamento
        Map<String, T_SituacaoPedido> existentes = new LinkedHashMap<>();
        atual.situacoes().forEach(s -> existentes.put(String.valueOf(s.getId()), s));
        Set<String> chavesPedidas = new HashSet<>();
        pedidas.forEach(s -> chavesPedidas.add(s.chave()));
        Map<Long, Long> abertos = new HashMap<>();
        pedidoRepository.contarAbertosPorSituacao(tenant, ABERTOS)
                .forEach(linha -> abertos.put((Long) linha[0], ((Number) linha[1]).longValue()));
        for (Map.Entry<String, T_SituacaoPedido> e : existentes.entrySet()) {
            if (!chavesPedidas.contains(e.getKey())) {
                long emAndamento = abertos.getOrDefault(e.getValue().getId(), 0L);
                if (emAndamento > 0) {
                    throw new RegraNegocioException("A situação \"" + e.getValue().getNome() + "\" tem " + emAndamento
                            + " pedido(s) em andamento: mova esses pedidos antes de removê-la");
                }
                e.getValue().setDeletado(true);
                e.getValue().setAtivo(false);
                situacaoRepository.save(e.getValue());
            }
        }

        // cria ou atualiza as situações, na ordem pedida
        Map<String, Long> idsPorChave = new HashMap<>();
        int ordem = 0;
        for (SituacaoRequest pedida : pedidas) {
            T_SituacaoPedido situacao = existentes.get(pedida.chave());
            boolean mudouCategoria = false;
            if (situacao == null) {
                situacao = new T_SituacaoPedido();
                situacao.setTenant(tenant);
            } else {
                mudouCategoria = situacao.getCategoria() != pedida.categoria();
            }
            situacao.setNome(pedida.nome().trim());
            situacao.setCor(pedida.cor().toLowerCase(Locale.ROOT));
            situacao.setCategoria(pedida.categoria());
            situacao.setOrdem(ordem++);
            situacao.setAtivo(pedida.ativa());
            situacao = situacaoRepository.save(situacao);
            idsPorChave.put(pedida.chave(), situacao.getId());
            if (mudouCategoria) {
                pedidoRepository.sincronizarCategoria(situacao.getId(), situacao.getCategoria());
            }
        }

        transicaoRepository.apagarDaLoja(tenant);
        transicaoRepository.flush();
        Set<String> vistas = new HashSet<>();
        for (TransicaoRequest t : transicoesPedidas) {
            String identidade = t.de() + ">" + t.para() + ":" + t.tipoPedido();
            if (!vistas.add(identidade)) {
                continue;
            }
            T_TransicaoPedido nova = new T_TransicaoPedido();
            nova.setTenant(tenant);
            nova.setIdDe(idsPorChave.get(t.de()));
            nova.setIdPara(idsPorChave.get(t.para()));
            nova.setTipoPedido(t.tipoPedido());
            nova.setRotulo(t.rotulo() == null || t.rotulo().isBlank() ? null : t.rotulo().trim());
            transicaoRepository.save(nova);
        }
        return obter(tenant);
    }

    /** Volta ao fluxo padrão: os pedidos passam para a situação padrão da mesma categoria. */
    @Transactional
    public FluxoResponse restaurarPadrao(UUID tenant) {
        List<T_SituacaoPedido> antigas = situacaoRepository.findByTenantAndDeletadoFalseOrderByOrdemAscIdAsc(tenant);
        transicaoRepository.apagarDaLoja(tenant);
        transicaoRepository.flush();
        antigas.forEach(s -> {
            s.setDeletado(true);
            s.setAtivo(false);
        });
        situacaoRepository.saveAll(antigas);
        situacaoRepository.flush();
        criarPadrao(tenant);
        return obter(tenant);
    }

    // ---------------------------------------------------------------- regras

    private void validar(List<SituacaoRequest> situacoes, List<TransicaoRequest> transicoes) {
        Set<String> chaves = new HashSet<>();
        Set<String> nomes = new HashSet<>();
        for (SituacaoRequest s : situacoes) {
            if (!chaves.add(s.chave())) {
                throw new RegraNegocioException("Situação repetida no fluxo");
            }
            if (!nomes.add(s.nome().trim().toLowerCase(Locale.ROOT))) {
                throw new RegraNegocioException("Já existe uma situação chamada \"" + s.nome().trim() + "\"");
            }
        }
        List<SituacaoRequest> ativas = situacoes.stream().filter(SituacaoRequest::ativa).toList();
        long cancelamentos = situacoes.stream().filter(s -> s.categoria() == StatusPedido.CANCELADO).count();
        if (cancelamentos != 1 || ativas.stream().noneMatch(s -> s.categoria() == StatusPedido.CANCELADO)) {
            throw new RegraNegocioException("O fluxo precisa ter uma (e só uma) situação de cancelamento, ativa");
        }
        if (ativas.isEmpty() || ativas.get(0).categoria() != StatusPedido.PENDENTE) {
            throw new RegraNegocioException("A primeira situação ativa é onde o pedido entra: ela deve ser do tipo \"Novo\"");
        }
        if (ativas.stream().noneMatch(s -> s.categoria() == StatusPedido.ENTREGUE)) {
            throw new RegraNegocioException("O fluxo precisa de ao menos uma situação final de conclusão (Concluído)");
        }
        Map<String, SituacaoRequest> porChave = new HashMap<>();
        situacoes.forEach(s -> porChave.put(s.chave(), s));
        for (TransicaoRequest t : transicoes) {
            SituacaoRequest de = porChave.get(t.de());
            SituacaoRequest para = porChave.get(t.para());
            if (de == null || para == null) {
                throw new RegraNegocioException("Há uma passagem ligada a uma situação que não existe");
            }
            if (t.de().equals(t.para())) {
                throw new RegraNegocioException("\"" + de.nome() + "\" não pode levar a ela mesma");
            }
            if (FINAIS.contains(de.categoria())) {
                throw new RegraNegocioException("\"" + de.nome() + "\" é final: dela o pedido não segue para outra situação");
            }
            if (para.categoria() == StatusPedido.CANCELADO) {
                throw new RegraNegocioException("Não crie passagem para o cancelamento: cancelar já é possível em qualquer situação");
            }
        }
        for (TipoEntrega tipo : TipoEntrega.values()) {
            validarCaminhos(ativas, transicoes, tipo);
        }
    }

    /** Para cada tipo de pedido: tudo que é alcançável precisa chegar a uma conclusão, e tudo precisa ser alcançável. */
    private void validarCaminhos(List<SituacaoRequest> ativas, List<TransicaoRequest> transicoes, TipoEntrega tipo) {
        Map<String, List<String>> saidas = new HashMap<>();
        for (TransicaoRequest t : transicoes) {
            if (t.tipoPedido() == null || t.tipoPedido() == tipo) {
                saidas.computeIfAbsent(t.de(), chave -> new ArrayList<>()).add(t.para());
            }
        }
        Map<String, SituacaoRequest> ativasPorChave = new HashMap<>();
        ativas.forEach(s -> ativasPorChave.put(s.chave(), s));
        String rotuloTipo = tipo == TipoEntrega.ENTREGA ? "de entrega" : "de retirada";

        Set<String> alcancaveis = alcancar(ativas.get(0).chave(), saidas, ativasPorChave);
        for (String chave : alcancaveis) {
            SituacaoRequest s = ativasPorChave.get(chave);
            if (s.categoria() == StatusPedido.ENTREGUE || s.categoria() == StatusPedido.CANCELADO) {
                continue;
            }
            boolean chegaAoFim = alcancar(chave, saidas, ativasPorChave).stream()
                    .anyMatch(c -> ativasPorChave.get(c).categoria() == StatusPedido.ENTREGUE);
            if (!chegaAoFim) {
                throw new RegraNegocioException("Em pedidos " + rotuloTipo + ", \"" + s.nome()
                        + "\" não leva a nenhuma situação de conclusão");
            }
        }
        if (alcancaveis.stream().noneMatch(c -> ativasPorChave.get(c).categoria() == StatusPedido.ENTREGUE)) {
            throw new RegraNegocioException("Pedidos " + rotuloTipo + " não conseguem chegar a uma situação de conclusão");
        }
        for (SituacaoRequest s : ativas) {
            if (s.categoria() != StatusPedido.CANCELADO && !alcancaveis.contains(s.chave()) && !alcancavelPorOutroTipo(s, ativas, transicoes, tipo)) {
                throw new RegraNegocioException("\"" + s.nome() + "\" nunca é alcançada: ligue uma situação a ela");
            }
        }
    }

    /** Uma situação só de entrega (ou só de retirada) não é alcançada pelo outro tipo, e isso é permitido. */
    private boolean alcancavelPorOutroTipo(SituacaoRequest alvo, List<SituacaoRequest> ativas, List<TransicaoRequest> transicoes,
                                           TipoEntrega tipoAtual) {
        for (TipoEntrega outro : TipoEntrega.values()) {
            if (outro == tipoAtual) {
                continue;
            }
            Map<String, List<String>> saidas = new HashMap<>();
            for (TransicaoRequest t : transicoes) {
                if (t.tipoPedido() == null || t.tipoPedido() == outro) {
                    saidas.computeIfAbsent(t.de(), chave -> new ArrayList<>()).add(t.para());
                }
            }
            Map<String, SituacaoRequest> porChave = new HashMap<>();
            ativas.forEach(s -> porChave.put(s.chave(), s));
            if (alcancar(ativas.get(0).chave(), saidas, porChave).contains(alvo.chave())) {
                return true;
            }
        }
        return false;
    }

    private Set<String> alcancar(String origem, Map<String, List<String>> saidas, Map<String, SituacaoRequest> ativas) {
        Set<String> vistos = new HashSet<>();
        ArrayDeque<String> fila = new ArrayDeque<>();
        fila.add(origem);
        vistos.add(origem);
        while (!fila.isEmpty()) {
            String atual = fila.poll();
            for (String proxima : saidas.getOrDefault(atual, List.of())) {
                if (ativas.containsKey(proxima) && vistos.add(proxima)) {
                    fila.add(proxima);
                }
            }
        }
        return vistos;
    }

    // ---------------------------------------------------------------- padrão

    private record Padrao(String nome, String cor, StatusPedido categoria) {
    }

    /** Cria o fluxo padrão da loja (o de sempre) e liga os pedidos existentes à situação da mesma categoria. */
    private void criarPadrao(UUID tenant) {
        List<Padrao> modelo = List.of(
                new Padrao("Pendente", "#f59e0b", StatusPedido.PENDENTE),
                new Padrao("Confirmado", "#3b82f6", StatusPedido.CONFIRMADO),
                new Padrao("Em preparo", "#f97316", StatusPedido.EM_PREPARO),
                new Padrao("Saiu para entrega", "#8b5cf6", StatusPedido.SAIU_PARA_ENTREGA),
                new Padrao("Entregue", "#22c55e", StatusPedido.ENTREGUE),
                new Padrao("Cancelado", "#ef4444", StatusPedido.CANCELADO));
        Map<StatusPedido, T_SituacaoPedido> criadas = new LinkedHashMap<>();
        int ordem = 0;
        for (Padrao p : modelo) {
            T_SituacaoPedido situacao = new T_SituacaoPedido();
            situacao.setTenant(tenant);
            situacao.setNome(p.nome());
            situacao.setCor(p.cor());
            situacao.setCategoria(p.categoria());
            situacao.setOrdem(ordem++);
            criadas.put(p.categoria(), situacaoRepository.save(situacao));
        }
        ligar(tenant, criadas, StatusPedido.PENDENTE, StatusPedido.CONFIRMADO, null, "Confirmar pedido");
        ligar(tenant, criadas, StatusPedido.CONFIRMADO, StatusPedido.EM_PREPARO, null, "Iniciar preparo");
        ligar(tenant, criadas, StatusPedido.EM_PREPARO, StatusPedido.SAIU_PARA_ENTREGA, TipoEntrega.ENTREGA, "Saiu para entrega");
        ligar(tenant, criadas, StatusPedido.EM_PREPARO, StatusPedido.ENTREGUE, TipoEntrega.RETIRADA, "Marcar como entregue");
        ligar(tenant, criadas, StatusPedido.SAIU_PARA_ENTREGA, StatusPedido.ENTREGUE, null, "Marcar como entregue");
        criadas.forEach((categoria, situacao) -> pedidoRepository.reatribuirPorCategoria(tenant, categoria, situacao.getId()));
    }

    private void ligar(UUID tenant, Map<StatusPedido, T_SituacaoPedido> situacoes, StatusPedido de, StatusPedido para,
                       TipoEntrega tipo, String rotulo) {
        T_TransicaoPedido t = new T_TransicaoPedido();
        t.setTenant(tenant);
        t.setIdDe(situacoes.get(de).getId());
        t.setIdPara(situacoes.get(para).getId());
        t.setTipoPedido(tipo);
        t.setRotulo(rotulo);
        transicaoRepository.save(t);
    }
}
