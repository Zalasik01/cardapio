package com.cardapio.service;

import com.cardapio.entity.S_ClienteConta;
import com.cardapio.entity.S_ClienteEndereco;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.S_ClienteEnderecoRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Endereços salvos do cliente (no máximo 10 por conta). */
@Service
@RequiredArgsConstructor
public class ClienteEnderecoService {

    private static final int LIMITE = 10;

    private final S_ClienteEnderecoRepository repository;

    public record EnderecoRequest(String apelido, String cep, String rua, String numero, String complemento, String bairro,
                                  String cidade, Double latitude, Double longitude) {
    }

    public record EnderecoResponse(Long id, String apelido, String cep, String rua, String numero, String complemento, String bairro,
                                   String cidade, Double latitude, Double longitude) {
        static EnderecoResponse of(S_ClienteEndereco e) {
            return new EnderecoResponse(e.getId(), e.getApelido(), e.getCep(), e.getRua(), e.getNumero(), e.getComplemento(),
                    e.getBairro(), e.getCidade(), e.getLatitude(), e.getLongitude());
        }
    }

    @Transactional(readOnly = true)
    public List<EnderecoResponse> listar(S_ClienteConta conta) {
        return repository.findByIdClienteContaAndDeletadoFalseOrderByCriadoEmDesc(conta.getId()).stream().map(EnderecoResponse::of).toList();
    }

    @Transactional
    public EnderecoResponse salvar(S_ClienteConta conta, EnderecoRequest r) {
        if (texto(r.apelido()) == null || texto(r.rua()) == null || texto(r.numero()) == null || texto(r.bairro()) == null) {
            throw new RegraNegocioException("Informe o nome do endereço, a rua, o número e o bairro");
        }
        if (repository.countByIdClienteContaAndDeletadoFalse(conta.getId()) >= LIMITE) {
            throw new RegraNegocioException("Você pode guardar até " + LIMITE + " endereços. Remova algum para salvar outro");
        }
        return EnderecoResponse.of(repository.save(S_ClienteEndereco.builder().idClienteConta(conta.getId()).apelido(texto(r.apelido()))
                .cep(texto(r.cep())).rua(texto(r.rua())).numero(texto(r.numero())).complemento(texto(r.complemento()))
                .bairro(texto(r.bairro())).cidade(texto(r.cidade())).latitude(r.latitude()).longitude(r.longitude())
                .criadoEm(LocalDateTime.now()).build()));
    }

    @Transactional
    public EnderecoResponse atualizar(S_ClienteConta conta, Long id, EnderecoRequest r) {
        S_ClienteEndereco e = repository.findByIdAndIdClienteContaAndDeletadoFalse(id, conta.getId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Endereço não encontrado"));
        if (texto(r.apelido()) == null || texto(r.rua()) == null || texto(r.numero()) == null || texto(r.bairro()) == null) {
            throw new RegraNegocioException("Informe o nome do endereço, a rua, o número e o bairro");
        }
        e.setApelido(texto(r.apelido()));
        e.setCep(texto(r.cep()));
        e.setRua(texto(r.rua()));
        e.setNumero(texto(r.numero()));
        e.setComplemento(texto(r.complemento()));
        e.setBairro(texto(r.bairro()));
        e.setCidade(texto(r.cidade()));
        e.setLatitude(r.latitude());
        e.setLongitude(r.longitude());
        return EnderecoResponse.of(repository.save(e));
    }

    @Transactional
    public void remover(S_ClienteConta conta, Long id) {
        S_ClienteEndereco e = repository.findByIdAndIdClienteContaAndDeletadoFalse(id, conta.getId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Endereço não encontrado"));
        e.setDeletado(true);
        e.setAtivo(false);
        repository.save(e);
    }

    private static String texto(String v) {
        return v == null || v.isBlank() ? null : v.trim();
    }
}
