package com.cardapio.service;

import com.cardapio.dto.gestao.GestaoDashboardResponse;
import com.cardapio.dto.gestao.GestaoDashboardResponse.Lojas;
import com.cardapio.dto.gestao.GestaoDashboardResponse.Mensalidades;
import com.cardapio.dto.gestao.GestaoDashboardResponse.Quantidade;
import com.cardapio.dto.gestao.GestaoDashboardResponse.Usuarios;
import com.cardapio.dto.gestao.GestaoDashboardResponse.Vencimento;
import com.cardapio.dto.gestao.RecebimentosResponse;
import com.cardapio.entity.S_LojaMensalidade;
import com.cardapio.entity.SituacaoConta;
import com.cardapio.entity.SituacaoMensalidade;
import com.cardapio.repository.S_LojaMensalidadeRepository;
import com.cardapio.repository.S_LojaRepository;
import com.cardapio.repository.S_UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/** Gestão Interna > Dashboards. Só o usuário administrador acessa (SecurityConfig). */
@Service
@RequiredArgsConstructor
public class GestaoDashboardService {

    private static final int ITENS_LISTA = 5;

    private final S_LojaRepository lojaRepository;
    private final S_LojaMensalidadeRepository mensalidadeRepository;
    private final S_UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public GestaoDashboardResponse montar() {
        LocalDate hoje = LocalDate.now();
        LocalDate competencia = hoje.withDayOfMonth(1);

        long total = lojaRepository.countByDeletadoFalse();
        long ativas = lojaRepository.countByDeletadoFalseAndAtivoTrue();
        Lojas lojas = new Lojas(total, ativas, total - ativas,
                quantidades(lojaRepository.contarPorSituacao()), quantidades(lojaRepository.contarPorTipo()));

        Mensalidades mensalidades = new Mensalidades(
                competencia,
                lojaRepository.somarMensalidadePadrao(SituacaoConta.ATIVA),
                somaDaCompetencia(competencia, SituacaoMensalidade.PENDENTE)
                        .add(somaDaCompetencia(competencia, SituacaoMensalidade.PAGA)),
                somaDaCompetencia(competencia, SituacaoMensalidade.PAGA),
                somaDaCompetencia(competencia, SituacaoMensalidade.PENDENTE),
                mensalidadeRepository.contarAtrasadas(hoje),
                mensalidadeRepository.somarAtrasadas(hoje),
                lojaRepository.contarSemMensalidadeNaCompetencia(
                        List.of(SituacaoConta.ATIVA, SituacaoConta.INADIMPLENTE), competencia));

        Usuarios usuarios = new Usuarios(
                usuarioRepository.contarInternos(),
                usuarioRepository.contarAdministradores(),
                usuarioRepository.contarInternosPendentes());

        return new GestaoDashboardResponse(
                lojas, mensalidades, usuarios,
                mensalidadeRepository.proximosVencimentos(hoje, PageRequest.of(0, ITENS_LISTA)).stream()
                        .map(this::vencimento).toList(),
                mensalidadeRepository.atrasadas(hoje, PageRequest.of(0, ITENS_LISTA)).stream()
                        .map(this::vencimento).toList());
    }

    /** Widget de período: mensalidades pagas entre inicio e fim (no máximo 90 dias). */
    @Transactional(readOnly = true)
    public RecebimentosResponse recebimentos(LocalDate inicio, LocalDate fim) {
        PeriodoFiltro.validar(inicio, fim);
        return new RecebimentosResponse(inicio, fim,
                mensalidadeRepository.somarPagasNoPeriodo(inicio, fim),
                mensalidadeRepository.contarPagasNoPeriodo(inicio, fim));
    }

    private java.math.BigDecimal somaDaCompetencia(LocalDate competencia, SituacaoMensalidade situacao) {
        return mensalidadeRepository.somarDaCompetencia(competencia, situacao);
    }

    private List<Quantidade> quantidades(List<Object[]> linhas) {
        return linhas.stream().map(l -> new Quantidade(String.valueOf(l[0]), (Long) l[1])).toList();
    }

    private Vencimento vencimento(S_LojaMensalidade m) {
        return new Vencimento(m.getLoja().getId(), m.getLoja().getNome(), m.getCompetencia(),
                m.getDataVencimento(), m.getValor());
    }
}
