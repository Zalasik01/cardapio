package com.cardapio.storage;

import java.util.Optional;

/**
 * Onde as imagens (logo da loja, foto de produto...) ficam guardadas. Hoje é o disco do servidor
 * ({@link ArmazenamentoLocal}); para escalar em vários servidores basta trocar por uma implementação de
 * armazenamento de objetos (S3, R2...) sem mexer no resto do sistema.
 */
public interface ArmazenamentoImagens {

    /** Guarda a imagem dentro da pasta lógica (ex.: o tenant da loja) e devolve o nome do arquivo gerado. */
    String salvar(String pasta, byte[] conteudo, String extensao);

    /** Conteúdo de uma imagem guardada, se existir. */
    Optional<byte[]> ler(String pasta, String arquivo);
}
