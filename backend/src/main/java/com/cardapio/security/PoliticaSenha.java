package com.cardapio.security;

import com.cardapio.exception.RegraNegocioException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Regras de senha forte. O frontend replica as mesmas regras para orientar o
 * usuario, mas a validacao valida e sempre a do backend.
 */
public final class PoliticaSenha {

    public static final int TAMANHO_MINIMO = 8;
    public static final int TAMANHO_MAXIMO = 72;

    private static final Set<String> COMUNS = Set.of(
            "12345678", "123456789", "1234567890", "87654321", "11111111", "00000000",
            "password", "password1", "passw0rd", "senha123", "senha1234", "senhasenha",
            "qwerty123", "qwertyui", "abc12345", "abcd1234", "admin123", "admin1234",
            "mudar123", "trocar123", "brasil123", "iloveyou");

    private PoliticaSenha() {
    }

    /** Lista as regras que a senha nao cumpre (vazia se for forte). */
    public static List<String> violacoes(String senha, String email, String nome) {
        List<String> violacoes = new ArrayList<>();
        if (senha == null || senha.length() < TAMANHO_MINIMO) {
            violacoes.add("ter pelo menos " + TAMANHO_MINIMO + " caracteres");
            if (senha == null) {
                return violacoes;
            }
        }
        if (senha.length() > TAMANHO_MAXIMO) {
            violacoes.add("ter no maximo " + TAMANHO_MAXIMO + " caracteres");
        }
        if (senha.chars().noneMatch(Character::isLowerCase)) {
            violacoes.add("ter uma letra minuscula");
        }
        if (senha.chars().noneMatch(Character::isUpperCase)) {
            violacoes.add("ter uma letra maiuscula");
        }
        if (senha.chars().noneMatch(Character::isDigit)) {
            violacoes.add("ter um numero");
        }
        if (senha.chars().allMatch(c -> Character.isLetterOrDigit(c))) {
            violacoes.add("ter um simbolo (por exemplo ! @ # $ %)");
        }

        String minuscula = senha.toLowerCase(Locale.ROOT);
        if (COMUNS.contains(minuscula) || senha.chars().distinct().count() <= 2) {
            violacoes.add("nao ser uma senha comum ou repetitiva");
        }
        if (contemDadosPessoais(minuscula, email, nome)) {
            violacoes.add("nao conter seu nome ou e-mail");
        }
        return violacoes;
    }

    /** Lanca RegraNegocioException com as regras nao cumpridas. */
    public static void validar(String senha, String email, String nome) {
        List<String> violacoes = violacoes(senha, email, nome);
        if (!violacoes.isEmpty()) {
            throw new RegraNegocioException("Senha fraca: a senha deve " + String.join(", ", violacoes) + ".");
        }
    }

    private static boolean contemDadosPessoais(String senhaMinuscula, String email, String nome) {
        if (email != null) {
            String usuarioEmail = email.toLowerCase(Locale.ROOT).split("@")[0];
            if (usuarioEmail.length() >= 4 && senhaMinuscula.contains(usuarioEmail)) {
                return true;
            }
        }
        if (nome != null) {
            for (String parte : nome.toLowerCase(Locale.ROOT).split("\\s+")) {
                if (parte.length() >= 4 && senhaMinuscula.contains(parte)) {
                    return true;
                }
            }
        }
        return false;
    }
}
