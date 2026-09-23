package com.cardapio.service;

import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.funcionario.EmailDto;
import com.cardapio.dto.funcionario.EnderecoDto;
import com.cardapio.dto.funcionario.FiltroFuncionario;
import com.cardapio.dto.funcionario.FuncionarioRequest;
import com.cardapio.dto.funcionario.FuncionarioResponse;
import com.cardapio.dto.funcionario.FuncionarioResumoResponse;
import com.cardapio.dto.funcionario.TelefoneDto;
import com.cardapio.entity.T_Funcionario;
import com.cardapio.entity.T_Pessoa;
import com.cardapio.entity.T_PessoaEmail;
import com.cardapio.entity.T_PessoaEndereco;
import com.cardapio.entity.T_PessoaFisica;
import com.cardapio.entity.T_PessoaTelefone;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.T_FuncionarioRepository;
import com.cardapio.repository.T_PerfilUsuarioRepository;
import com.cardapio.repository.T_PessoaEmailRepository;
import com.cardapio.repository.T_PessoaEnderecoRepository;
import com.cardapio.repository.T_PessoaFisicaRepository;
import com.cardapio.repository.T_PessoaRepository;
import com.cardapio.repository.T_PessoaTelefoneRepository;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * CRUD de funcionarios da loja. Os dados pessoais ficam em t_pessoa_fisica (+ endereco e
 * contatos, ligados a t_pessoa); o t_funcionario guarda os dados de trabalho.
 */
@Service
@RequiredArgsConstructor
public class FuncionarioService {

    private static final int TAMANHO_MAXIMO_PAGINA = 50;

    private final T_FuncionarioRepository funcionarioRepository;
    private final T_PessoaRepository pessoaRepository;
    private final T_PessoaFisicaRepository pessoaFisicaRepository;
    private final T_PessoaEnderecoRepository enderecoRepository;
    private final T_PessoaTelefoneRepository telefoneRepository;
    private final T_PessoaEmailRepository emailRepository;
    private final T_PerfilUsuarioRepository perfilUsuarioRepository;

    @Transactional(readOnly = true)
    public PaginaResponse<FuncionarioResumoResponse> buscar(UUID tenant, FiltroFuncionario filtro, int pagina, int tamanho) {
        int tamanhoLimitado = Math.min(Math.max(tamanho, 1), TAMANHO_MAXIMO_PAGINA);
        var resultado = funcionarioRepository.findAll(
                especificacao(tenant, filtro), PageRequest.of(Math.max(pagina, 0), tamanhoLimitado));
        return PaginaResponse.of(resultado, FuncionarioResumoResponse::of);
    }

    @Transactional(readOnly = true)
    public FuncionarioResponse obter(UUID tenant, Long id) {
        return montarResposta(buscarFuncionario(tenant, id));
    }

    @Transactional
    public FuncionarioResponse criar(UUID tenant, FuncionarioRequest request) {
        String cpf = validarCpf(request.cpf());
        if (pessoaFisicaRepository.existsByTenantAndCpfAndDeletadoFalse(tenant, cpf)) {
            throw new RegraNegocioException("Ja existe um funcionario com este CPF");
        }

        T_PessoaFisica pessoaFisica = T_PessoaFisica.builder().tenant(tenant).build();
        preencherPessoaFisica(pessoaFisica, request, cpf);
        pessoaFisica = pessoaFisicaRepository.save(pessoaFisica);

        T_Pessoa pessoa = pessoaRepository.save(T_Pessoa.builder().tenant(tenant).pessoaFisica(pessoaFisica).build());

        T_Funcionario funcionario = T_Funcionario.builder().tenant(tenant).pessoa(pessoa).build();
        preencherFuncionario(funcionario, request);
        funcionario = funcionarioRepository.save(funcionario);

        salvarEndereco(pessoa, request.endereco());
        salvarContatos(pessoa, request);
        return montarResposta(funcionario);
    }

    @Transactional
    public FuncionarioResponse atualizar(UUID tenant, Long id, FuncionarioRequest request) {
        T_Funcionario funcionario = buscarFuncionario(tenant, id);
        T_Pessoa pessoa = funcionario.getPessoa();
        T_PessoaFisica pessoaFisica = pessoa.getPessoaFisica();

        String cpf = validarCpf(request.cpf());
        if (pessoaFisicaRepository.existsByTenantAndCpfAndDeletadoFalseAndIdNot(tenant, cpf, pessoaFisica.getId())) {
            throw new RegraNegocioException("Ja existe outro funcionario com este CPF");
        }

        preencherPessoaFisica(pessoaFisica, request, cpf);
        pessoaFisicaRepository.save(pessoaFisica);
        preencherFuncionario(funcionario, request);
        funcionarioRepository.save(funcionario);

        salvarEndereco(pessoa, request.endereco());
        salvarContatos(pessoa, request);
        return montarResposta(funcionario);
    }

    /** Exclusao logica. Nao permite excluir um funcionario que ainda tem usuario vinculado. */
    @Transactional
    public void excluir(UUID tenant, Long id) {
        T_Funcionario funcionario = buscarFuncionario(tenant, id);
        T_Pessoa pessoa = funcionario.getPessoa();

        if (perfilUsuarioRepository.existsByPessoaIdAndDeletadoFalse(pessoa.getId())) {
            throw new RegraNegocioException("Este funcionario possui um usuario vinculado. Exclua o usuario primeiro.");
        }

        funcionario.setDeletado(true);
        funcionario.setAtivo(false);
        funcionarioRepository.save(funcionario);

        T_PessoaFisica pessoaFisica = pessoa.getPessoaFisica();
        pessoaFisica.setDeletado(true); // libera o CPF para novo cadastro
        pessoaFisica.setAtivo(false);
        pessoaFisicaRepository.save(pessoaFisica);
    }

    private T_Funcionario buscarFuncionario(UUID tenant, Long id) {
        return funcionarioRepository.findByIdAndTenantAndDeletadoFalse(id, tenant)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Funcionario nao encontrado"));
    }

    /** O formato e os digitos verificadores ja foram validados pelo @CPF do request; aqui so normaliza. */
    private String validarCpf(String cpf) {
        return Documentos.soDigitos(cpf);
    }

    private void preencherPessoaFisica(T_PessoaFisica pessoaFisica, FuncionarioRequest request, String cpf) {
        pessoaFisica.setNome(request.nome().trim());
        pessoaFisica.setApelido(vazioParaNulo(request.apelido()));
        pessoaFisica.setCpf(cpf);
        pessoaFisica.setRg(vazioParaNulo(request.rg()));
        pessoaFisica.setSexo(request.sexo());
        pessoaFisica.setDataNascimento(request.dataNascimento());
        pessoaFisica.setNaturalidade(vazioParaNulo(request.naturalidade()));
        pessoaFisica.setNacionalidade(vazioParaNulo(request.nacionalidade()));
        pessoaFisica.setEstadoCivil(request.estadoCivil());
        pessoaFisica.setProfissao(vazioParaNulo(request.profissao()));
        pessoaFisica.setObservacao(vazioParaNulo(request.observacao()));
    }

    private void preencherFuncionario(T_Funcionario funcionario, FuncionarioRequest request) {
        funcionario.setNumeroCnh(vazioParaNulo(request.numeroCnh()));
        funcionario.setVencimentoCnh(request.vencimentoCnh());
        if (request.ativo() != null) {
            funcionario.setAtivo(request.ativo());
        }
    }

    private void salvarEndereco(T_Pessoa pessoa, EnderecoDto dto) {
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
    private void salvarContatos(T_Pessoa pessoa, FuncionarioRequest request) {
        if (request.telefones() != null) {
            telefoneRepository.deleteByPessoaId(pessoa.getId());
            telefoneRepository.flush();
            telefoneRepository.saveAll(request.telefones().stream()
                    .map(dto -> T_PessoaTelefone.builder().tenant(pessoa.getTenant()).pessoa(pessoa)
                            .tipo(dto.tipo()).numero(dto.numero().trim()).observacao(vazioParaNulo(dto.observacao())).build())
                    .toList());
        }
        if (request.emails() != null) {
            emailRepository.deleteByPessoaId(pessoa.getId());
            emailRepository.flush();
            emailRepository.saveAll(request.emails().stream()
                    .map(dto -> T_PessoaEmail.builder().tenant(pessoa.getTenant()).pessoa(pessoa)
                            .email(dto.email().trim().toLowerCase(Locale.ROOT)).observacao(vazioParaNulo(dto.observacao())).build())
                    .toList());
        }
    }

    private FuncionarioResponse montarResposta(T_Funcionario funcionario) {
        T_Pessoa pessoa = funcionario.getPessoa();
        T_PessoaFisica pf = pessoa.getPessoaFisica();

        EnderecoDto endereco = enderecoRepository.findByPessoaId(pessoa.getId())
                .map(e -> new EnderecoDto(e.getCep(), e.getLogradouro(), e.getNumero(), e.getComplemento(),
                        e.getBairro(), e.getCidade(), e.getEstado()))
                .orElse(new EnderecoDto(null, null, null, null, null, null, null));
        List<TelefoneDto> telefones = telefoneRepository.findByPessoaIdOrderByIdAsc(pessoa.getId()).stream()
                .map(t -> new TelefoneDto(t.getTipo(), t.getNumero(), t.getObservacao())).toList();
        List<EmailDto> emails = emailRepository.findByPessoaIdOrderByIdAsc(pessoa.getId()).stream()
                .map(e -> new EmailDto(e.getEmail(), e.getObservacao())).toList();

        return new FuncionarioResponse(
                funcionario.getId(), funcionario.isAtivo(), pf.getSexo(), pf.getCpf(),
                pf.getRg(), pf.getApelido(), pf.getNome(), pf.getNaturalidade(), pf.getNacionalidade(),
                pf.getDataNascimento(), pf.getProfissao(), pf.getEstadoCivil(), funcionario.getNumeroCnh(),
                funcionario.getVencimentoCnh(), pf.getObservacao(), endereco, telefones, emails);
    }

    private Specification<T_Funcionario> especificacao(UUID tenant, FiltroFuncionario filtro) {
        return (root, query, cb) -> {
            Join<T_Funcionario, T_Pessoa> pessoa = root.join("pessoa");
            Join<T_Pessoa, T_PessoaFisica> pessoaFisica = pessoa.join("pessoaFisica");
            Expression<String> nome = cb.lower(pessoaFisica.get("nome"));
            Expression<String> apelido = cb.lower(cb.coalesce(pessoaFisica.<String>get("apelido"), ""));
            Expression<String> cpf = cb.coalesce(pessoaFisica.<String>get("cpf"), "");

            List<Predicate> filtros = new ArrayList<>();
            filtros.add(cb.equal(root.get("tenant"), tenant));
            filtros.add(cb.isFalse(root.get("deletado")));

            if (temTexto(filtro.busca())) {
                String padrao = padrao(filtro.busca());
                List<Predicate> ou = new ArrayList<>(List.of(
                        cb.like(nome, padrao, '\\'), cb.like(apelido, padrao, '\\')));
                String digitos = Documentos.soDigitos(filtro.busca());
                if (!digitos.isEmpty()) {
                    ou.add(cb.like(cpf, "%" + digitos + "%"));
                }
                filtros.add(cb.or(ou.toArray(new Predicate[0])));
            }
            if (temTexto(filtro.nome())) {
                filtros.add(cb.like(nome, padrao(filtro.nome()), '\\'));
            }
            if (temTexto(filtro.cpf())) {
                String digitos = Documentos.soDigitos(filtro.cpf());
                if (!digitos.isEmpty()) {
                    filtros.add(cb.like(cpf, "%" + digitos + "%"));
                }
            }
            // por padrao so lista registros ativos; o filtro "Inativo" permite consultar os demais
            filtros.add(cb.equal(root.get("ativo"), filtro.ativo() == null || filtro.ativo()));

            if (query.getResultType() != Long.class) {
                query.orderBy(cb.asc(nome));
            }
            return cb.and(filtros.toArray(new Predicate[0]));
        };
    }

    private boolean temTexto(String valor) {
        return valor != null && !valor.isBlank();
    }

    private String vazioParaNulo(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }

    private String padrao(String valor) {
        String escapado = valor.trim().toLowerCase(Locale.ROOT)
                .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return "%" + escapado + "%";
    }
}
