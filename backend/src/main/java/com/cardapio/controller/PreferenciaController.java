package com.cardapio.controller;

import com.cardapio.entity.S_UsuarioPreferencia;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.S_UsuarioPreferenciaRepository;
import com.cardapio.repository.S_UsuarioRepository;
import com.cardapio.security.AppUserDetails;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Preferências de tela do usuário logado (posição dos widgets, período escolhido...). Sempre do usuário da
 * sessão: não existe como ler ou gravar as de outro usuário. O valor é um JSON definido pelo frontend.
 */
@RestController
@RequestMapping("/api/perfil/preferencias")
@RequiredArgsConstructor
public class PreferenciaController {

    private static final java.util.regex.Pattern CHAVE_VALIDA = java.util.regex.Pattern.compile("^[a-z0-9][a-z0-9-]{0,79}$");

    private final S_UsuarioPreferenciaRepository preferenciaRepository;
    private final S_UsuarioRepository usuarioRepository;

    public record PreferenciaRequest(@NotNull @Size(max = 20000) String valor) {
    }

    /** valor é nulo quando o usuário ainda não salvou nada para a chave. */
    public record PreferenciaResponse(String valor) {
    }

    @GetMapping("/{chave}")
    public PreferenciaResponse obter(@PathVariable String chave,
                                     @AuthenticationPrincipal AppUserDetails logado) {
        validarChave(chave);
        return new PreferenciaResponse(preferenciaRepository.findByUsuarioIdAndChave(logado.getUsuarioId(), chave)
                .map(S_UsuarioPreferencia::getValor).orElse(null));
    }

    @Transactional
    @PutMapping("/{chave}")
    public PreferenciaResponse salvar(@PathVariable String chave,
                                      @Valid @RequestBody PreferenciaRequest request,
                                      @AuthenticationPrincipal AppUserDetails logado) {
        validarChave(chave);
        S_UsuarioPreferencia preferencia = preferenciaRepository.findByUsuarioIdAndChave(logado.getUsuarioId(), chave)
                .orElseGet(() -> S_UsuarioPreferencia.builder()
                        .usuario(usuarioRepository.getReferenceById(logado.getUsuarioId())).chave(chave).build());
        preferencia.setValor(request.valor());
        preferenciaRepository.save(preferencia);
        return new PreferenciaResponse(request.valor());
    }

    private void validarChave(String chave) {
        if (!CHAVE_VALIDA.matcher(chave).matches()) {
            throw new RegraNegocioException("Chave de preferência inválida");
        }
    }
}
