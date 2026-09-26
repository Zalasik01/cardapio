package com.cardapio.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/** Provedor de desenvolvimento: só escreve o código no log do backend. Substituir por WhatsApp/SMS em produção. */
@Component
@Slf4j
public class LogProvedorOtp implements ProvedorOtp {

    @Override
    public void enviar(String telefone, String codigo) {
        log.info("[OTP] código para {}: {}", telefone, codigo);
    }
}
