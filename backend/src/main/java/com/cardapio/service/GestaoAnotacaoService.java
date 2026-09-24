package com.cardapio.service;

import com.cardapio.dto.gestao.AnotacaoRequest;
import com.cardapio.dto.gestao.AnotacaoResponse;
import com.cardapio.entity.S_Loja;
import com.cardapio.entity.S_LojaAnotacao;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.repository.S_LojaAnotacaoRepository;
import com.cardapio.repository.S_LojaRepository;
import com.cardapio.repository.S_UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** Gestão Interna: anotações da equipe sobre cada loja. Só o usuário administrador acessa (SecurityConfig). */
@Service
@RequiredArgsConstructor
public class GestaoAnotacaoService {

    private final S_LojaRepository lojaRepository;
    private final S_UsuarioRepository usuarioRepository;
    private final S_LojaAnotacaoRepository anotacaoRepository;

    @Transactional(readOnly = true)
    public List<AnotacaoResponse> listar(Long lojaId) {
        buscarLoja(lojaId);
        return anotacaoRepository.findByLojaIdAndDeletadoFalseOrderByDataCriacaoDesc(lojaId).stream()
                .map(AnotacaoResponse::of).toList();
    }

    @Transactional
    public AnotacaoResponse criar(Long lojaId, AnotacaoRequest request, Long usuarioLogadoId) {
        S_LojaAnotacao anotacao = S_LojaAnotacao.builder()
                .loja(buscarLoja(lojaId))
                .usuario(usuarioRepository.getReferenceById(usuarioLogadoId))
                .texto(request.texto().trim())
                .build();
        return AnotacaoResponse.of(anotacaoRepository.save(anotacao));
    }

    @Transactional
    public AnotacaoResponse atualizar(Long lojaId, Long id, AnotacaoRequest request) {
        S_LojaAnotacao anotacao = buscarAnotacao(lojaId, id);
        anotacao.setTexto(request.texto().trim());
        anotacao.setDataAlteracao(LocalDateTime.now().withNano(0));
        return AnotacaoResponse.of(anotacaoRepository.save(anotacao));
    }

    @Transactional
    public void excluir(Long lojaId, Long id) {
        S_LojaAnotacao anotacao = buscarAnotacao(lojaId, id);
        anotacao.setDeletado(true);
        anotacao.setAtivo(false);
        anotacaoRepository.save(anotacao);
    }

    private S_Loja buscarLoja(Long lojaId) {
        return lojaRepository.findById(lojaId)
                .filter(loja -> !loja.isDeletado())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Loja não encontrada"));
    }

    private S_LojaAnotacao buscarAnotacao(Long lojaId, Long id) {
        return anotacaoRepository.findByIdAndLojaIdAndDeletadoFalse(id, lojaId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Anotação não encontrada"));
    }
}
