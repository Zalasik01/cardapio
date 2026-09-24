package com.cardapio.service;

import com.cardapio.entity.S_Usuario;
import com.cardapio.entity.S_UsuarioFoto;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.S_UsuarioFotoRepository;
import com.cardapio.repository.S_UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

/** Foto de perfil do usuario (PNG, JPEG ou WEBP de ate 2 MB). O tipo e conferido pelo conteudo, nao pelo nome. */
@Service
@RequiredArgsConstructor
public class UsuarioFotoService {

    public static final long TAMANHO_MAXIMO_BYTES = 2L * 1024 * 1024;

    public record Foto(String tipoConteudo, byte[] conteudo) {
    }

    private final UsuarioLojaService usuarioLojaService;
    private final S_UsuarioFotoRepository fotoRepository;
    private final S_UsuarioRepository usuarioRepository;

    @Transactional
    public void salvar(UUID tenant, Long usuarioId, MultipartFile arquivo) {
        salvarDoUsuario(usuarioLojaService.buscarVinculo(tenant, usuarioId).getUsuario().getId(), arquivo);
    }

    @Transactional
    public void salvarDoUsuario(Long usuarioId, MultipartFile arquivo) {
        S_Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado"));

        if (arquivo == null || arquivo.isEmpty()) {
            throw new RegraNegocioException("Selecione uma imagem");
        }
        if (arquivo.getSize() > TAMANHO_MAXIMO_BYTES) {
            throw new RegraNegocioException("A imagem deve ter no máximo 2 MB");
        }
        byte[] conteudo;
        try {
            conteudo = arquivo.getBytes();
        } catch (IOException e) {
            throw new RegraNegocioException("Não foi possível ler a imagem");
        }
        String tipo = detectarTipo(conteudo);
        if (tipo == null) {
            throw new RegraNegocioException("Formato de imagem não suportado. Use PNG, JPEG ou WEBP");
        }

        S_UsuarioFoto foto = fotoRepository.findByUsuarioId(usuario.getId())
                .orElseGet(() -> S_UsuarioFoto.builder().usuario(usuario).build());
        foto.setTipoConteudo(tipo);
        foto.setConteudo(conteudo);
        fotoRepository.save(foto);
    }

    @Transactional(readOnly = true)
    public Foto obter(UUID tenant, Long usuarioId) {
        return obterDoUsuario(usuarioLojaService.buscarVinculo(tenant, usuarioId).getUsuario().getId());
    }

    @Transactional(readOnly = true)
    public Foto obterDoUsuario(Long usuarioId) {
        return fotoRepository.findByUsuarioId(usuarioId)
                .map(foto -> new Foto(foto.getTipoConteudo(), foto.getConteudo()))
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário sem foto"));
    }

    @Transactional
    public void remover(UUID tenant, Long usuarioId) {
        removerDoUsuario(usuarioLojaService.buscarVinculo(tenant, usuarioId).getUsuario().getId());
    }

    @Transactional
    public void removerDoUsuario(Long usuarioId) {
        fotoRepository.findByUsuarioId(usuarioId).ifPresent(fotoRepository::delete);
    }

    private String detectarTipo(byte[] b) {
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') {
            return "image/png";
        }
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return "image/webp";
        }
        return null;
    }
}
