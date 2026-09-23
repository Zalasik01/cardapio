package com.cardapio.service;

/** Utilitarios de documentos brasileiros (a validacao do CPF e feita pelo @CPF do Hibernate Validator). */
public final class Documentos {

    private Documentos() {
    }

    /** Mantem so os digitos (aceita CPF formatado ou nao). Nulo vira nulo. */
    public static String soDigitos(String valor) {
        return valor == null ? null : valor.replaceAll("\\D", "");
    }
}
