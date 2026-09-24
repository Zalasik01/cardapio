package com.cardapio.service;

import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.funcionario.FiltroFuncionario;
import com.cardapio.dto.funcionario.FuncionarioRequest;
import com.cardapio.dto.funcionario.FuncionarioResponse;
import com.cardapio.dto.funcionario.FuncionarioResumoResponse;
import com.cardapio.entity.T_Funcionario;
import com.cardapio.entity.T_Pessoa;
import com.cardapio.entity.T_PessoaFisica;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.T_FuncionarioRepository;
import com.cardapio.repository.T_PerfilUsuarioRepository;
import com.cardapio.repository.T_PessoaEmailRepository;
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
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
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
    private final T_PessoaTelefoneRepository telefoneRepository;
    private final T_PessoaEmailRepository emailRepository;
    private final PessoaContatoService contatoService;
    private final T_PerfilUsuarioRepository perfilUsuarioRepository;

    @Transactional(readOnly = true)
    public PaginaResponse<FuncionarioResumoResponse> buscar(UUID tenant, FiltroFuncionario filtro, int pagina, int tamanho) {
        int tamanhoLimitado = Math.min(Math.max(tamanho, 1), TAMANHO_MAXIMO_PAGINA);
        var resultado = funcionarioRepository.findAll(
                especificacao(tenant, filtro), PageRequest.of(Math.max(pagina, 0), tamanhoLimitado));

        // telefones e e-mails da pagina inteira em 2 consultas (evita uma consulta por funcionario)
        List<Long> pessoaIds = resultado.getContent().stream().map(f -> f.getPessoa().getId()).toList();
        Map<Long, List<String>> telefones = new HashMap<>();
        Map<Long, List<String>> emails = new HashMap<>();
        if (!pessoaIds.isEmpty()) {
            telefoneRepository.findByPessoaIdInOrderByIdAsc(pessoaIds).forEach(t ->
                    telefones.computeIfAbsent(t.getPessoa().getId(), k -> new ArrayList<>()).add(t.getNumero()));
            emailRepository.findByPessoaIdInOrderByIdAsc(pessoaIds).forEach(e ->
                    emails.computeIfAbsent(e.getPessoa().getId(), k -> new ArrayList<>()).add(e.getEmail()));
        }
        return PaginaResponse.of(resultado, f -> FuncionarioResumoResponse.of(f,
                telefones.getOrDefault(f.getPessoa().getId(), List.of()),
                emails.getOrDefault(f.getPessoa().getId(), List.of())));
    }

    @Transactional(readOnly = true)
    public FuncionarioResponse obter(UUID tenant, Long id) {
        return montarResposta(buscarFuncionario(tenant, id));
    }

    @Transactional
    public FuncionarioResponse criar(UUID tenant, FuncionarioRequest request) {
        String cpf = validarCpf(request.cpf());
        if (pessoaFisicaRepository.existsByTenantAndCpfAndDeletadoFalse(tenant, cpf)) {
            throw new RegraNegocioException("Já existe um funcionário com este CPF");
        }

        T_PessoaFisica pessoaFisica = T_PessoaFisica.builder().tenant(tenant).build();
        preencherPessoaFisica(pessoaFisica, request, cpf);
        pessoaFisica = pessoaFisicaRepository.save(pessoaFisica);

        T_Pessoa pessoa = pessoaRepository.save(T_Pessoa.builder().tenant(tenant).pessoaFisica(pessoaFisica).build());

        T_Funcionario funcionario = T_Funcionario.builder().tenant(tenant).pessoa(pessoa).build();
        preencherFuncionario(funcionario, request);
        funcionario = funcionarioRepository.save(funcionario);

        contatoService.salvarEndereco(pessoa, request.endereco());
        contatoService.salvarContatos(pessoa, request.telefones(), request.emails());
        return montarResposta(funcionario);
    }

    @Transactional
    public FuncionarioResponse atualizar(UUID tenant, Long id, FuncionarioRequest request) {
        T_Funcionario funcionario = buscarFuncionario(tenant, id);
        T_Pessoa pessoa = funcionario.getPessoa();
        T_PessoaFisica pessoaFisica = pessoa.getPessoaFisica();

        String cpf = validarCpf(request.cpf());
        if (pessoaFisicaRepository.existsByTenantAndCpfAndDeletadoFalseAndIdNot(tenant, cpf, pessoaFisica.getId())) {
            throw new RegraNegocioException("Já existe outro funcionário com este CPF");
        }

        preencherPessoaFisica(pessoaFisica, request, cpf);
        pessoaFisicaRepository.save(pessoaFisica);
        preencherFuncionario(funcionario, request);
        funcionarioRepository.save(funcionario);

        contatoService.salvarEndereco(pessoa, request.endereco());
        contatoService.salvarContatos(pessoa, request.telefones(), request.emails());
        return montarResposta(funcionario);
    }

    /** Exclusao logica. Nao permite excluir um funcionario que ainda tem usuario vinculado. */
    @Transactional
    public void excluir(UUID tenant, Long id) {
        T_Funcionario funcionario = buscarFuncionario(tenant, id);
        T_Pessoa pessoa = funcionario.getPessoa();

        if (perfilUsuarioRepository.existsByPessoaIdAndDeletadoFalse(pessoa.getId())) {
            throw new RegraNegocioException("Este funcionário possui um usuário vinculado. Exclua o usuário primeiro.");
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
                .orElseThrow(() -> new RecursoNaoEncontradoException("Funcionário não encontrado"));
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

    private FuncionarioResponse montarResposta(T_Funcionario funcionario) {
        T_Pessoa pessoa = funcionario.getPessoa();
        T_PessoaFisica pf = pessoa.getPessoaFisica();

        return new FuncionarioResponse(
                funcionario.getId(), funcionario.isAtivo(), pf.getSexo(), pf.getCpf(),
                pf.getRg(), pf.getApelido(), pf.getNome(), pf.getNaturalidade(), pf.getNacionalidade(),
                pf.getDataNascimento(), pf.getProfissao(), pf.getEstadoCivil(), funcionario.getNumeroCnh(),
                funcionario.getVencimentoCnh(), pf.getObservacao(), contatoService.endereco(pessoa.getId()),
                contatoService.telefones(pessoa.getId()), contatoService.emails(pessoa.getId()));
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
            // por padrao so lista registros ativos; "Mostrar inativos" inclui os demais
            if (!filtro.mostrarInativos()) {
                filtros.add(cb.isTrue(root.get("ativo")));
            }

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
