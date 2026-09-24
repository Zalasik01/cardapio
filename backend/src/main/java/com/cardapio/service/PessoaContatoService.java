package com.cardapio.service;

import com.cardapio.dto.funcionario.EmailDto;
import com.cardapio.dto.funcionario.EnderecoDto;
import com.cardapio.dto.funcionario.TelefoneDto;
import com.cardapio.entity.T_Pessoa;
import com.cardapio.entity.T_PessoaEmail;
import com.cardapio.entity.T_PessoaEndereco;
import com.cardapio.entity.T_PessoaTelefone;
import com.cardapio.repository.T_PessoaEmailRepository;
import com.cardapio.repository.T_PessoaEnderecoRepository;
import com.cardapio.repository.T_PessoaTelefoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

/** Endereco e contatos (telefones e e-mails) de uma pessoa, compartilhados por funcionarios, clientes e fornecedores. */
@Service
@RequiredArgsConstructor
public class PessoaContatoService {

    private final T_PessoaEnderecoRepository enderecoRepository;
    private final T_PessoaTelefoneRepository telefoneRepository;
    private final T_PessoaEmailRepository emailRepository;

    @Transactional
    public void salvarEndereco(T_Pessoa pessoa, EnderecoDto dto) {
        if (dto == null) {
            return;
        }
        T_PessoaEndereco endereco = enderecoRepository.findByPessoaId(pessoa.getId())
                .orElseGet(() -> T_PessoaEndereco.builder().tenant(pessoa.getTenant()).pessoa(pessoa).build());
        endereco.setCep(vazioParaNulo(dto.cep()));
        endereco.setLogradouro(vazioParaNulo(dto.logradouro()));
        endereco.setNumero(vazioParaNulo(dto.numero()));
        endereco.setComplemento(vazioParaNulo(dto.complemento()));
        endereco.setBairro(vazioParaNulo(dto.bairro()));
        endereco.setCidade(vazioParaNulo(dto.cidade()));
        endereco.setEstado(dto.estado() == null || dto.estado().isBlank() ? null : dto.estado().trim().toUpperCase(Locale.ROOT));
        enderecoRepository.save(endereco);
    }

    /** Os contatos enviados substituem os anteriores. Lista nula significa "nao mexer". */
    @Transactional
    public void salvarContatos(T_Pessoa pessoa, List<TelefoneDto> telefones, List<EmailDto> emails) {
        if (telefones != null) {
            telefoneRepository.deleteByPessoaId(pessoa.getId());
            telefoneRepository.flush();
            telefoneRepository.saveAll(telefones.stream()
                    .map(dto -> T_PessoaTelefone.builder().tenant(pessoa.getTenant()).pessoa(pessoa)
                            .tipo(dto.tipo()).numero(dto.numero().trim()).observacao(vazioParaNulo(dto.observacao())).build())
                    .toList());
        }
        if (emails != null) {
            emailRepository.deleteByPessoaId(pessoa.getId());
            emailRepository.flush();
            emailRepository.saveAll(emails.stream()
                    .map(dto -> T_PessoaEmail.builder().tenant(pessoa.getTenant()).pessoa(pessoa)
                            .email(dto.email().trim().toLowerCase(Locale.ROOT)).observacao(vazioParaNulo(dto.observacao())).build())
                    .toList());
        }
    }

    @Transactional(readOnly = true)
    public EnderecoDto endereco(Long pessoaId) {
        return enderecoRepository.findByPessoaId(pessoaId)
                .map(e -> new EnderecoDto(e.getCep(), e.getLogradouro(), e.getNumero(), e.getComplemento(),
                        e.getBairro(), e.getCidade(), e.getEstado()))
                .orElse(new EnderecoDto(null, null, null, null, null, null, null));
    }

    @Transactional(readOnly = true)
    public List<TelefoneDto> telefones(Long pessoaId) {
        return telefoneRepository.findByPessoaIdOrderByIdAsc(pessoaId).stream()
                .map(t -> new TelefoneDto(t.getTipo(), t.getNumero(), t.getObservacao())).toList();
    }

    @Transactional(readOnly = true)
    public List<EmailDto> emails(Long pessoaId) {
        return emailRepository.findByPessoaIdOrderByIdAsc(pessoaId).stream()
                .map(e -> new EmailDto(e.getEmail(), e.getObservacao())).toList();
    }

    private String vazioParaNulo(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
