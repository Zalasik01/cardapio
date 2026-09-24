package com.cardapio.service;

import com.cardapio.dto.auth.UsuarioLogadoResponse;
import com.cardapio.entity.S_Usuario;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.S_UsuarioFotoRepository;
import com.cardapio.repository.S_UsuarioRepository;
import com.cardapio.security.PoliticaSenha;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** "Seu perfil": o proprio usuario logado edita nome, WhatsApp, senha e foto. */
@Service
@RequiredArgsConstructor
public class PerfilService {

    private final S_UsuarioRepository usuarioRepository;
    private final S_UsuarioFotoRepository fotoRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UsuarioLogadoResponse atualizar(Long usuarioId, String nome, String whatsapp, String papel) {
        S_Usuario usuario = buscar(usuarioId);

        String digitos = Documentos.soDigitos(whatsapp);
        if (digitos != null && !digitos.isEmpty() && (digitos.length() < 10 || digitos.length() > 13)) {
            throw new RegraNegocioException("WhatsApp inválido: informe DDD e número");
        }

        usuario.setNome(nome.trim());
        usuario.setWhatsapp(digitos == null || digitos.isEmpty() ? null : digitos);
        usuarioRepository.save(usuario);

        return UsuarioLogadoResponse.of(usuario, papel, fotoRepository.existsByUsuarioId(usuarioId));
    }

    @Transactional
    public void alterarSenha(Long usuarioId, String senhaAtual, String novaSenha) {
        S_Usuario usuario = buscar(usuarioId);

        if (usuario.isExigeTrocarSenha()) {
            // troca obrigatoria (senha temporaria): so exige que a nova seja diferente da temporaria
            if (passwordEncoder.matches(novaSenha, usuario.getSenha())) {
                throw new RegraNegocioException("A nova senha deve ser diferente da senha temporária");
            }
        } else {
            if (senhaAtual == null || !passwordEncoder.matches(senhaAtual, usuario.getSenha())) {
                throw new RegraNegocioException("Senha atual incorreta");
            }
            if (senhaAtual.equals(novaSenha)) {
                throw new RegraNegocioException("A nova senha deve ser diferente da atual");
            }
        }
        PoliticaSenha.validar(novaSenha, usuario.getEmail(), usuario.getNome());

        usuario.setSenha(passwordEncoder.encode(novaSenha));
        usuario.setExigeTrocarSenha(false);
        usuarioRepository.save(usuario);
    }

    private S_Usuario buscar(Long usuarioId) {
        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado"));
    }
}
