package com.cardapio.dto.funcionamento;

import com.cardapio.dto.funcionamento.FuncionamentoRequest.HorarioDto;
import com.cardapio.entity.ModoFuncionamento;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Situação atual da loja. proximaMudanca é quando ela abre ou fecha (no fuso da loja), nulo se não há
 * mudança prevista (modo forçado ou sem horários). semHorarios: no modo automático, a loja é tratada como
 * sempre aberta enquanto não houver horários cadastrados. horarios só vem na consulta completa.
 */
public record FuncionamentoResponse(
        ModoFuncionamento modo,
        boolean aberta,
        boolean semHorarios,
        LocalDateTime proximaMudanca,
        List<HorarioDto> horarios,
        LocalDateTime pausadoAte,
        Integer limitePedidosEmPreparo,
        String motivo
) {
}
