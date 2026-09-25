package com.cardapio.service;

import com.cardapio.exception.RegraNegocioException;
import com.cardapio.storage.ArmazenamentoImagens;
import java.io.IOException;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/** Recebe imagens enviadas pelo painel (logo, produtos...), confere o tipo pelo conteúdo e devolve o endereço público. */
@Service
@RequiredArgsConstructor
public class ImagemService {

    public static final String CAMINHO_PUBLICO = "/api/publico/imagens/";
    private static final long TAMANHO_MAXIMO = 2L * 1024 * 1024;
    private static final Map<String, String> TIPOS = Map.of("png", "image/png", "jpg", "image/jpeg", "webp", "image/webp");

    private final ArmazenamentoImagens armazenamento;

    /** Guarda a imagem na pasta e devolve o endereço para usar como logo/imagem (ex.: /api/publico/imagens/pasta/arquivo.png). */
    public String enviar(String pasta, MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new RegraNegocioException("Selecione uma imagem");
        }
        if (arquivo.getSize() > TAMANHO_MAXIMO) {
            throw new RegraNegocioException("A imagem deve ter no máximo 2 MB");
        }
        try {
            byte[] conteudo = arquivo.getBytes();
            String extensao = extensaoPeloConteudo(conteudo);
            if (extensao == null) {
                throw new RegraNegocioException("Envie uma imagem PNG, JPEG ou WEBP");
            }
            return CAMINHO_PUBLICO + pasta + "/" + armazenamento.salvar(pasta, conteudo, extensao);
        } catch (IOException e) {
            throw new RegraNegocioException("Não foi possível ler a imagem enviada");
        }
    }

    public String tipoDe(String arquivo) {
        String extensao = arquivo.substring(arquivo.lastIndexOf('.') + 1).toLowerCase();
        return TIPOS.getOrDefault(extensao, "application/octet-stream");
    }

    /** Descobre o formato pelos primeiros bytes (o nome e o tipo informados pelo navegador não são confiáveis). */
    private String extensaoPeloConteudo(byte[] b) {
        if (b.length > 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') {
            return "png";
        }
        if (b.length > 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return "jpg";
        }
        if (b.length > 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F' && b[8] == 'W' && b[9] == 'E'
                && b[10] == 'B' && b[11] == 'P') {
            return "webp";
        }
        return null;
    }
}
