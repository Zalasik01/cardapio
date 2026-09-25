package com.cardapio.storage;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Guarda as imagens em arquivos numa pasta do servidor (em produção, um volume persistente). */
@Component
public class ArmazenamentoLocal implements ArmazenamentoImagens {

    private final Path raiz;

    public ArmazenamentoLocal(@Value("${app.uploads.dir:/data/uploads}") String diretorio) {
        this.raiz = Path.of(diretorio).toAbsolutePath().normalize();
    }

    @Override
    public String salvar(String pasta, byte[] conteudo, String extensao) {
        String arquivo = UUID.randomUUID() + "." + extensao;
        try {
            Path destino = resolver(pasta, arquivo);
            Files.createDirectories(destino.getParent());
            Files.write(destino, conteudo);
            return arquivo;
        } catch (IOException e) {
            throw new UncheckedIOException("Não foi possível gravar a imagem", e);
        }
    }

    @Override
    public Optional<byte[]> ler(String pasta, String arquivo) {
        try {
            Path origem = resolver(pasta, arquivo);
            return Files.isRegularFile(origem) ? Optional.of(Files.readAllBytes(origem)) : Optional.empty();
        } catch (IOException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    /** Monta o caminho garantindo que nunca sai da pasta raiz (sem ../). */
    private Path resolver(String pasta, String arquivo) {
        Path caminho = raiz.resolve(pasta).resolve(arquivo).normalize();
        if (!caminho.startsWith(raiz)) {
            throw new IllegalArgumentException("Caminho inválido");
        }
        return caminho;
    }
}
