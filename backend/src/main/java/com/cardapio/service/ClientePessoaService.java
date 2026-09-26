package com.cardapio.service;

import com.cardapio.dto.funcionario.TelefoneDto;
import com.cardapio.dto.pessoa.PessoaRequest;
import com.cardapio.entity.S_ClienteConta;
import com.cardapio.entity.T_Pessoa;
import com.cardapio.entity.TipoPessoa;
import com.cardapio.entity.TipoTelefone;
import com.cardapio.repository.T_PessoaRepository;
import com.cardapio.repository.T_PessoaTelefoneRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Liga a conta do cliente do cardápio online (telefone + OTP) ao cadastro de Clientes e Fornecedores da loja.
 * Quem se cadastra pelo app/site aparece lá, marcado com a origem "App/site"; quem já era cliente da loja (mesmo
 * telefone) só ganha o vínculo com a conta, sem duplicar.
 */
@Service
@RequiredArgsConstructor
public class ClientePessoaService {

    public static final String ORIGEM_APP_SITE = "APP_SITE";

    private final T_PessoaRepository pessoaRepository;
    private final T_PessoaTelefoneRepository telefoneRepository;
    private final PessoaService pessoaService;

    /** Garante que a conta tenha um cliente na loja; devolve o id da pessoa. Idempotente. */
    @Transactional
    public Long garantir(UUID tenant, S_ClienteConta conta, String nomeInformado) {
        var vinculada = pessoaRepository.findFirstByTenantAndIdClienteContaAndDeletadoFalse(tenant, conta.getId());
        if (vinculada.isPresent()) {
            return vinculada.get().getId();
        }
        // já é cliente da loja com o mesmo telefone (cadastrado pelo painel): só vincula
        List<T_Pessoa> mesmoTelefone = telefoneRepository.clientesComTelefone(tenant, "%" + conta.getTelefone());
        if (!mesmoTelefone.isEmpty()) {
            T_Pessoa existente = mesmoTelefone.get(0);
            existente.setIdClienteConta(conta.getId());
            return pessoaRepository.save(existente).getId();
        }
        String nome = primeiroTexto(nomeInformado, conta.getNome(), "Cliente " + conta.getTelefone());
        var criada = pessoaService.criar(tenant, new PessoaRequest(TipoPessoa.FISICA, true, true, false,
                "Cadastrado automaticamente pelo app/site (conta por telefone).", nome, null, null, null, null, null, null, null,
                null, null, null, null, null, null,
                List.of(new TelefoneDto(TipoTelefone.CELULAR, conta.getTelefone(), "Confirmado por código (OTP)")), null));
        T_Pessoa pessoa = pessoaRepository.findById(criada.id()).orElseThrow();
        pessoa.setOrigem(ORIGEM_APP_SITE);
        pessoa.setIdClienteConta(conta.getId());
        return pessoaRepository.save(pessoa).getId();
    }

    private static String primeiroTexto(String... opcoes) {
        for (String o : opcoes) {
            if (o != null && !o.isBlank()) {
                return o.trim();
            }
        }
        return "Cliente";
    }
}
