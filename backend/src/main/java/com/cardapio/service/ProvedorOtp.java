package com.cardapio.service;

/** Canal por onde o código chega ao cliente (WhatsApp, SMS...). Trocar o canal é trocar só esta implementação. */
public interface ProvedorOtp {

    void enviar(String telefone, String codigo);
}
