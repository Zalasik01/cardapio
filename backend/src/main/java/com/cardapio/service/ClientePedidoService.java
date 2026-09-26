package com.cardapio.service;

import com.cardapio.dto.funcionario.EnderecoDto;
import com.cardapio.dto.funcionario.TelefoneDto;
import com.cardapio.dto.pessoa.FiltroPessoa;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Clientes cadastrados, com telefone e endereço, para a loja escolher ao lançar um pedido. */
@Service
@RequiredArgsConstructor
public class ClientePedidoService {

    private static final int LIMITE = 8;

    private final PessoaService pessoaService;
    private final PessoaContatoService contatoService;

    public record ClienteParaPedido(Long id, String nome, String telefone, String cep, String logradouro, String numero,
                                    String complemento, String bairro, String cidade,
                                    java.util.List<com.cardapio.dto.pessoa.EnderecoPessoaDto> enderecos) {
    }

    @Transactional(readOnly = true)
    public List<ClienteParaPedido> buscar(UUID tenant, String busca) {
        var filtro = new FiltroPessoa(busca, null, null, null, "CLIENTE", false);
        return pessoaService.buscar(tenant, filtro, 0, LIMITE).content().stream().map(pessoa -> {
            List<TelefoneDto> telefones = contatoService.telefones(pessoa.id());
            EnderecoDto endereco = contatoService.endereco(pessoa.id());
            return new ClienteParaPedido(pessoa.id(), pessoa.nome(),
                    telefones.isEmpty() ? null : telefones.get(0).numero(),
                    endereco != null ? endereco.cep() : null, endereco != null ? endereco.logradouro() : null,
                    endereco != null ? endereco.numero() : null, endereco != null ? endereco.complemento() : null,
                    endereco != null ? endereco.bairro() : null, endereco != null ? endereco.cidade() : null,
                    contatoService.enderecos(pessoa.id()));
        }).toList();
    }
}
