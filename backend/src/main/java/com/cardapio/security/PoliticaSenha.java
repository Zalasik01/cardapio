package com.cardapio.security;

import com.cardapio.exception.RegraNegocioException;
import org.passay.CharacterRule;
import org.passay.DictionaryRule;
import org.passay.DictionarySubstringRule;
import org.passay.EnglishCharacterData;
import org.passay.LengthRule;
import org.passay.PasswordData;
import org.passay.PasswordValidator;
import org.passay.RepeatCharactersRule;
import org.passay.RuleResult;
import org.passay.dictionary.ArrayWordList;
import org.passay.dictionary.WordListDictionary;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;

/**
 * Politica de senha forte, montada com o Passay (biblioteca padrao de validacao de senhas).
 * O frontend replica as mesmas regras para orientar o usuario enquanto ele digita, mas a
 * validacao valida e sempre a do backend.
 */
public final class PoliticaSenha {

    public static final int TAMANHO_MINIMO = 8;
    public static final int TAMANHO_MAXIMO = 72;
    private static final int REPETICAO_MAXIMA = 4;
    private static final int TAMANHO_MINIMO_DADO_PESSOAL = 4;

    private static final String[] COMUNS = {
            "12345678", "123456789", "1234567890", "87654321", "password", "password1", "passw0rd", "senha123",
            "senha1234", "senhasenha", "qwerty123", "qwertyui", "abc12345", "abcd1234", "admin123", "admin1234",
            "mudar123", "trocar123", "brasil123", "iloveyou",
    };

    private static final WordListDictionary DICIONARIO_COMUNS = new WordListDictionary(
            new ArrayWordList(ordenado(COMUNS), false));

    private PoliticaSenha() {
    }

    /** Lista as regras que a senha nao cumpre, em portugues (vazia se for forte). */
    public static List<String> violacoes(String senha, String email, String nome) {
        RuleResult resultado = validador(email, nome).validate(new PasswordData(senha == null ? "" : senha));

        List<String> violacoes = new ArrayList<>();
        resultado.getDetails().forEach(detalhe -> {
            String mensagem = traduzir(detalhe.getErrorCode());
            if (!violacoes.contains(mensagem)) {
                violacoes.add(mensagem);
            }
        });
        return violacoes;
    }

    /** Lanca RegraNegocioException com as regras nao cumpridas. */
    public static void validar(String senha, String email, String nome) {
        List<String> violacoes = violacoes(senha, email, nome);
        if (!violacoes.isEmpty()) {
            throw new RegraNegocioException("Senha fraca: a senha deve " + String.join(", ", violacoes) + ".");
        }
    }

    private static PasswordValidator validador(String email, String nome) {
        List<org.passay.Rule> regras = new ArrayList<>(List.of(
                new LengthRule(TAMANHO_MINIMO, TAMANHO_MAXIMO),
                new CharacterRule(EnglishCharacterData.LowerCase, 1),
                new CharacterRule(EnglishCharacterData.UpperCase, 1),
                new CharacterRule(EnglishCharacterData.Digit, 1),
                new CharacterRule(EnglishCharacterData.Special, 1),
                new RepeatCharactersRule(REPETICAO_MAXIMA),
                new DictionaryRule(DICIONARIO_COMUNS)));

        // nome e e-mail do usuario nao podem aparecer dentro da senha
        String[] dadosPessoais = dadosPessoais(email, nome);
        if (dadosPessoais.length > 0) {
            regras.add(new DictionarySubstringRule(new WordListDictionary(new ArrayWordList(dadosPessoais, false))));
        }
        return new PasswordValidator(regras);
    }

    /** Partes do e-mail (antes do @) e do nome com tamanho suficiente para serem significativas, ordenadas. */
    private static String[] dadosPessoais(String email, String nome) {
        Stream<String> partes = Stream.concat(
                email == null ? Stream.empty() : Stream.of(email.split("@")[0]),
                nome == null ? Stream.empty() : Arrays.stream(nome.trim().split("\\s+")));
        return ordenado(partes
                .map(parte -> parte.toLowerCase(Locale.ROOT))
                .filter(parte -> parte.length() >= TAMANHO_MINIMO_DADO_PESSOAL)
                .distinct()
                .toArray(String[]::new));
    }

    private static String[] ordenado(String[] palavras) {
        String[] copia = palavras.clone();
        Arrays.sort(copia, String.CASE_INSENSITIVE_ORDER); // o ArrayWordList exige a lista ordenada
        return copia;
    }

    private static String traduzir(String codigo) {
        return switch (codigo) {
            case "TOO_SHORT" -> "ter pelo menos " + TAMANHO_MINIMO + " caracteres";
            case "TOO_LONG" -> "ter no maximo " + TAMANHO_MAXIMO + " caracteres";
            case "INSUFFICIENT_LOWERCASE" -> "ter uma letra minuscula";
            case "INSUFFICIENT_UPPERCASE" -> "ter uma letra maiuscula";
            case "INSUFFICIENT_DIGIT" -> "ter um numero";
            case "INSUFFICIENT_SPECIAL" -> "ter um simbolo (por exemplo ! @ # $ %)";
            case "ILLEGAL_MATCH", "ILLEGAL_WORD" -> "nao ser uma senha comum";
            case "ILLEGAL_WORD_SUBSTRING", "ILLEGAL_SUBSTRING" -> "nao conter seu nome ou e-mail";
            case "ILLEGAL_REPEATED_CHARS", "ILLEGAL_REPEAT_CHARS" -> "nao ter " + REPETICAO_MAXIMA + " ou mais caracteres iguais seguidos";
            default -> "cumprir as regras de seguranca";
        };
    }
}
