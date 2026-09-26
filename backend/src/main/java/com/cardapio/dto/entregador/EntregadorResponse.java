package com.cardapio.dto.entregador;

import com.cardapio.entity.T_Entregador;
import com.cardapio.entity.TipoEntregador;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** token é o segredo do link do entregador: só quem administra os entregadores recebe. */
public record EntregadorResponse(
        Long id,
        String nome,
        String telefone,
        TipoEntregador tipo,
        String veiculo,
        BigDecimal repassePorEntrega,
        boolean ativo,
        UUID token,
        LocalDateTime posicaoEm
) {

    public static EntregadorResponse of(T_Entregador e) {
        return new EntregadorResponse(e.getId(), e.getNome(), e.getTelefone(), e.getTipo(), e.getVeiculo(),
                e.getRepassePorEntrega(), e.isAtivo(), e.getToken(), e.getPosicaoEm());
    }
}
