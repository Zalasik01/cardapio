package com.cardapio.dto.gestao;

import com.cardapio.entity.S_LojaAnotacao;

import java.time.LocalDateTime;

/** Anotação da loja: quem escreveu, quando, e quando foi alterada (nulo se nunca foi). */
public record AnotacaoResponse(
        Long id,
        String texto,
        Long usuarioId,
        String usuarioNome,
        LocalDateTime dataCriacao,
        LocalDateTime dataAlteracao
) {

    public static AnotacaoResponse of(S_LojaAnotacao a) {
        return new AnotacaoResponse(
                a.getId(), a.getTexto(), a.getUsuario().getId(), a.getUsuario().getNome(),
                a.getDataCriacao(), a.getDataAlteracao());
    }
}
