package com.cardapio.service;

/** Utilitarios de documentos brasileiros. */
public final class Documentos {

    private Documentos() {
    }

    /** Mantem so os digitos (aceita CPF formatado ou nao). Nulo vira nulo. */
    public static String soDigitos(String valor) {
        return valor == null ? null : valor.replaceAll("\\D", "");
    }

    /** Valida os 11 digitos e os dois digitos verificadores do CPF. */
    public static boolean cpfValido(String cpf) {
        String digitos = soDigitos(cpf);
        if (digitos == null || digitos.length() != 11 || digitos.chars().distinct().count() == 1) {
            return false;
        }
        return digitoVerificador(digitos, 9) == digitos.charAt(9) - '0'
                && digitoVerificador(digitos, 10) == digitos.charAt(10) - '0';
    }

    private static int digitoVerificador(String digitos, int quantidade) {
        int soma = 0;
        for (int i = 0; i < quantidade; i++) {
            soma += (digitos.charAt(i) - '0') * (quantidade + 1 - i);
        }
        int resto = (soma * 10) % 11;
        return resto == 10 ? 0 : resto;
    }
}
