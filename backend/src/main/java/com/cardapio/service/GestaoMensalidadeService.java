package com.cardapio.service;

import com.cardapio.dto.gestao.MensalidadeRequest;
import com.cardapio.dto.gestao.MensalidadeResponse;
import com.cardapio.entity.S_Loja;
import com.cardapio.entity.S_LojaMensalidade;
import com.cardapio.entity.SituacaoMensalidade;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.S_LojaMensalidadeRepository;
import com.cardapio.repository.S_LojaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/** Gestão Interna: mensalidades cobradas de cada loja. Só o usuário administrador acessa (SecurityConfig). */
@Service
@RequiredArgsConstructor
public class GestaoMensalidadeService {

    private final S_LojaRepository lojaRepository;
    private final S_LojaMensalidadeRepository mensalidadeRepository;

    @Transactional(readOnly = true)
    public List<MensalidadeResponse> listar(Long lojaId) {
        buscarLoja(lojaId);
        return mensalidadeRepository.findByLojaIdAndDeletadoFalseOrderByCompetenciaDesc(lojaId).stream()
                .map(MensalidadeResponse::of).toList();
    }

    @Transactional
    public MensalidadeResponse criar(Long lojaId, MensalidadeRequest request) {
        S_Loja loja = buscarLoja(lojaId);
        LocalDate competencia = request.competencia().withDayOfMonth(1);
        if (mensalidadeRepository.existsByLojaIdAndCompetenciaAndDeletadoFalse(lojaId, competencia)) {
            throw new RegraNegocioException("Já existe uma mensalidade desta competência para a loja");
        }
        S_LojaMensalidade mensalidade = S_LojaMensalidade.builder().loja(loja).build();
        preencher(mensalidade, request, competencia);
        return MensalidadeResponse.of(mensalidadeRepository.save(mensalidade));
    }

    @Transactional
    public MensalidadeResponse atualizar(Long lojaId, Long id, MensalidadeRequest request) {
        S_LojaMensalidade mensalidade = buscarMensalidade(lojaId, id);
        LocalDate competencia = request.competencia().withDayOfMonth(1);
        if (mensalidadeRepository.existsByLojaIdAndCompetenciaAndDeletadoFalseAndIdNot(lojaId, competencia, id)) {
            throw new RegraNegocioException("Já existe uma mensalidade desta competência para a loja");
        }
        preencher(mensalidade, request, competencia);
        return MensalidadeResponse.of(mensalidadeRepository.save(mensalidade));
    }

    /** Exclusão lógica (libera a competência para um novo lançamento). */
    @Transactional
    public void excluir(Long lojaId, Long id) {
        S_LojaMensalidade mensalidade = buscarMensalidade(lojaId, id);
        mensalidade.setDeletado(true);
        mensalidade.setAtivo(false);
        mensalidadeRepository.save(mensalidade);
    }

    private void preencher(S_LojaMensalidade mensalidade, MensalidadeRequest request, LocalDate competencia) {
        mensalidade.setCompetencia(competencia);
        mensalidade.setValor(request.valor());
        mensalidade.setDataVencimento(request.dataVencimento());
        mensalidade.setSituacao(request.situacao());
        // paga sem data informada vale hoje; nas demais situações não há data de pagamento
        mensalidade.setDataPagamento(request.situacao() == SituacaoMensalidade.PAGA
                ? (request.dataPagamento() != null ? request.dataPagamento() : LocalDate.now())
                : null);
        String observacao = request.observacao();
        mensalidade.setObservacao(observacao == null || observacao.isBlank() ? null : observacao.trim());
    }

    private S_Loja buscarLoja(Long lojaId) {
        return lojaRepository.findById(lojaId)
                .filter(loja -> !loja.isDeletado())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Loja não encontrada"));
    }

    private S_LojaMensalidade buscarMensalidade(Long lojaId, Long id) {
        return mensalidadeRepository.findByIdAndLojaIdAndDeletadoFalse(id, lojaId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Mensalidade não encontrada"));
    }
}
