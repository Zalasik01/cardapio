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

/** "Seu perfil": o proprio usuario logado edita nome, WhatsApp, senha e configuracoes. */
@Service
@RequiredArgsConstructor
public class PerfilService {

    private final S_UsuarioRepository usuarioRepository;
    private final S_UsuarioFotoRepository fotoRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UsuarioLogadoResponse atualizar(Long usuarioId, String nome, String whatsapp,
                                           boolean salvarConfiguracoes, String configuracoes, String papel) {
        S_Usuario usuario = buscar(usuarioId);

        String digitos = Documentos.soDigitos(whatsapp);
        if (digitos != null && !digitos.isEmpty() && (digitos.length() < 10 || digitos.length() > 13)) {
            throw new RegraNegocioException("WhatsApp invalido: informe DDD e numero");
        }

        usuario.setNome(nome.trim());
        usuario.setWhatsapp(digitos == null || digitos.isEmpty() ? null : digitos);
        usuario.setSalvarConfiguracoes(salvarConfiguracoes);
        // sem o opt-in as preferencias ficam so no navegador; desmarcar apaga o que estava guardado
        usuario.setConfiguracoes(salvarConfiguracoes ? configuracoes : null);
        usuarioRepository.save(usuario);

        return UsuarioLogadoResponse.of(usuario, papel, fotoRepository.existsByUsuarioId(usuarioId));
    }

    @Transactional
    public void alterarSenha(Long usuarioId, String senhaAtual, String novaSenha) {
        S_Usuario usuario = buscar(usuarioId);

        if (!passwordEncoder.matches(senhaAtual, usuario.getSenha())) {
            throw new RegraNegocioException("Senha atual incorreta");
        }
        if (senhaAtual.equals(novaSenha)) {
            throw new RegraNegocioException("A nova senha deve ser diferente da atual");
        }
        PoliticaSenha.validar(novaSenha, usuario.getEmail(), usuario.getNome());

        usuario.setSenha(passwordEncoder.encode(novaSenha));
        usuario.setExigeTrocarSenha(false);
        usuarioRepository.save(usuario);
    }

    private S_Usuario buscar(Long usuarioId) {
        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuario nao encontrado"));
    }
}
