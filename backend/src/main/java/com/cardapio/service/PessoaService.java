package com.cardapio.service;

import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.pessoa.FiltroPessoa;
import com.cardapio.dto.pessoa.PessoaRequest;
import com.cardapio.dto.pessoa.PessoaResponse;
import com.cardapio.dto.pessoa.PessoaResumoResponse;
import com.cardapio.entity.T_Pessoa;
import com.cardapio.entity.T_PessoaFisica;
import com.cardapio.entity.T_PessoaJuridica;
import com.cardapio.entity.TipoPessoa;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.T_PessoaEmailRepository;
import com.cardapio.repository.T_PessoaFisicaRepository;
import com.cardapio.repository.T_PessoaJuridicaRepository;
import com.cardapio.repository.T_PessoaRepository;
import com.cardapio.repository.T_PessoaTelefoneRepository;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
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
 * CRUD de clientes e fornecedores da loja: uma t_pessoa fisica ou juridica marcada como
 * cliente e/ou fornecedor, com endereco e contatos (ligados a t_pessoa).
 */
@Service
@RequiredArgsConstructor
public class PessoaService {

    private static final int TAMANHO_MAXIMO_PAGINA = 50;

    private final T_PessoaRepository pessoaRepository;
    private final T_PessoaFisicaRepository pessoaFisicaRepository;
    private final T_PessoaJuridicaRepository pessoaJuridicaRepository;
    private final T_PessoaTelefoneRepository telefoneRepository;
    private final T_PessoaEmailRepository emailRepository;
    private final PessoaContatoService contatoService;

    @Transactional(readOnly = true)
    public PaginaResponse<PessoaResumoResponse> buscar(UUID tenant, FiltroPessoa filtro, int pagina, int tamanho) {
        int tamanhoLimitado = Math.min(Math.max(tamanho, 1), TAMANHO_MAXIMO_PAGINA);
        var resultado = pessoaRepository.findAll(
                especificacao(tenant, filtro), PageRequest.of(Math.max(pagina, 0), tamanhoLimitado));

        // telefones e e-mails da pagina inteira em 2 consultas (evita uma consulta por pessoa)
        List<Long> ids = resultado.getContent().stream().map(T_Pessoa::getId).toList();
        Map<Long, List<String>> telefones = new HashMap<>();
        Map<Long, List<String>> emails = new HashMap<>();
        if (!ids.isEmpty()) {
            telefoneRepository.findByPessoaIdInOrderByIdAsc(ids).forEach(t ->
                    telefones.computeIfAbsent(t.getPessoa().getId(), k -> new ArrayList<>()).add(t.getNumero()));
            emailRepository.findByPessoaIdInOrderByIdAsc(ids).forEach(e ->
                    emails.computeIfAbsent(e.getPessoa().getId(), k -> new ArrayList<>()).add(e.getEmail()));
        }
        return PaginaResponse.of(resultado, p -> PessoaResumoResponse.of(p,
                telefones.getOrDefault(p.getId(), List.of()), emails.getOrDefault(p.getId(), List.of())));
    }

    @Transactional(readOnly = true)
    public PessoaResponse obter(UUID tenant, Long id) {
        return montarResposta(buscarPessoa(tenant, id));
    }

    @Transactional
    public PessoaResponse criar(UUID tenant, PessoaRequest request) {
        validarPapel(request);
        T_Pessoa pessoa = T_Pessoa.builder().tenant(tenant).build();
        if (request.tipo() == TipoPessoa.FISICA) {
            String cpf = Documentos.soDigitos(request.cpf());
            if (temTexto(cpf) && pessoaFisicaRepository.existsByTenantAndCpfAndDeletadoFalse(tenant, cpf)) {
                throw new RegraNegocioException("Já existe uma pessoa com este CPF");
            }
            T_PessoaFisica fisica = T_PessoaFisica.builder().tenant(tenant).build();
            preencherFisica(fisica, request);
            pessoa.setPessoaFisica(pessoaFisicaRepository.save(fisica));
        } else {
            String cnpj = Documentos.soDigitos(request.cnpj());
            if (temTexto(cnpj) && pessoaJuridicaRepository.existsByTenantAndCnpjAndDeletadoFalse(tenant, cnpj)) {
                throw new RegraNegocioException("Já existe uma pessoa com este CNPJ");
            }
            T_PessoaJuridica juridica = T_PessoaJuridica.builder().tenant(tenant).build();
            preencherJuridica(juridica, request);
            pessoa.setPessoaJuridica(pessoaJuridicaRepository.save(juridica));
        }
        preencherPessoa(pessoa, request);
        pessoa = pessoaRepository.save(pessoa);

        contatoService.salvarEndereco(pessoa, request.endereco());
        contatoService.salvarContatos(pessoa, request.telefones(), request.emails());
        return montarResposta(pessoa);
    }

    @Transactional
    public PessoaResponse atualizar(UUID tenant, Long id, PessoaRequest request) {
        validarPapel(request);
        T_Pessoa pessoa = buscarPessoa(tenant, id);
        boolean eraFisica = pessoa.getPessoaFisica() != null;
        if (eraFisica != (request.tipo() == TipoPessoa.FISICA)) {
            throw new RegraNegocioException("Não é possível trocar o tipo (física/jurídica) de um cadastro existente");
        }

        if (eraFisica) {
            T_PessoaFisica fisica = pessoa.getPessoaFisica();
            String cpf = Documentos.soDigitos(request.cpf());
            if (temTexto(cpf) && pessoaFisicaRepository.existsByTenantAndCpfAndDeletadoFalseAndIdNot(tenant, cpf, fisica.getId())) {
                throw new RegraNegocioException("Já existe outra pessoa com este CPF");
            }
            preencherFisica(fisica, request);
            pessoaFisicaRepository.save(fisica);
        } else {
            T_PessoaJuridica juridica = pessoa.getPessoaJuridica();
            String cnpj = Documentos.soDigitos(request.cnpj());
            if (temTexto(cnpj) && pessoaJuridicaRepository.existsByTenantAndCnpjAndDeletadoFalseAndIdNot(tenant, cnpj, juridica.getId())) {
                throw new RegraNegocioException("Já existe outra pessoa com este CNPJ");
            }
            preencherJuridica(juridica, request);
            pessoaJuridicaRepository.save(juridica);
        }
        preencherPessoa(pessoa, request);
        pessoaRepository.save(pessoa);

        contatoService.salvarEndereco(pessoa, request.endereco());
        contatoService.salvarContatos(pessoa, request.telefones(), request.emails());
        return montarResposta(pessoa);
    }

    /** Exclusao logica; libera o CPF/CNPJ para um novo cadastro. */
    @Transactional
    public void excluir(UUID tenant, Long id) {
        T_Pessoa pessoa = buscarPessoa(tenant, id);
        pessoa.setDeletado(true);
        pessoa.setAtivo(false);
        pessoaRepository.save(pessoa);

        if (pessoa.getPessoaFisica() != null) {
            pessoa.getPessoaFisica().setDeletado(true);
            pessoa.getPessoaFisica().setAtivo(false);
            pessoaFisicaRepository.save(pessoa.getPessoaFisica());
        } else {
            pessoa.getPessoaJuridica().setDeletado(true);
            pessoa.getPessoaJuridica().setAtivo(false);
            pessoaJuridicaRepository.save(pessoa.getPessoaJuridica());
        }
    }

    private T_Pessoa buscarPessoa(UUID tenant, Long id) {
        T_Pessoa pessoa = pessoaRepository.findByIdAndTenantAndDeletadoFalse(id, tenant)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente/fornecedor não encontrado"));
        if (!pessoa.isCliente() && !pessoa.isFornecedor()) {
            throw new RecursoNaoEncontradoException("Cliente/fornecedor não encontrado"); // ex.: pessoa que e so funcionario
        }
        return pessoa;
    }

    private void validarPapel(PessoaRequest request) {
        if (!request.cliente() && !request.fornecedor()) {
            throw new RegraNegocioException("Informe se a pessoa é cliente, fornecedor ou os dois");
        }
        if (request.tipo() == TipoPessoa.FISICA && !temTexto(request.nome())) {
            throw new RegraNegocioException("Informe o nome");
        }
        if (request.tipo() == TipoPessoa.JURIDICA && !temTexto(request.razaoSocial())) {
            throw new RegraNegocioException("Informe a razão social");
        }
    }

    private void preencherPessoa(T_Pessoa pessoa, PessoaRequest request) {
        pessoa.setCliente(request.cliente());
        pessoa.setFornecedor(request.fornecedor());
        if (request.ativo() != null) {
            pessoa.setAtivo(request.ativo());
        }
    }

    private void preencherFisica(T_PessoaFisica fisica, PessoaRequest request) {
        fisica.setNome(request.nome().trim());
        fisica.setApelido(vazioParaNulo(request.apelido()));
        String cpf = Documentos.soDigitos(request.cpf());
        fisica.setCpf(temTexto(cpf) ? cpf : null);
        fisica.setRg(vazioParaNulo(request.rg()));
        fisica.setSexo(request.sexo());
        fisica.setDataNascimento(request.dataNascimento());
        fisica.setEstadoCivil(request.estadoCivil());
        fisica.setProfissao(vazioParaNulo(request.profissao()));
        fisica.setObservacao(vazioParaNulo(request.observacao()));
    }

    private void preencherJuridica(T_PessoaJuridica juridica, PessoaRequest request) {
        juridica.setRazaoSocial(request.razaoSocial().trim());
        juridica.setNomeFantasia(vazioParaNulo(request.nomeFantasia()));
        String cnpj = Documentos.soDigitos(request.cnpj());
        juridica.setCnpj(temTexto(cnpj) ? cnpj : null);
        juridica.setInscricaoEstadual(vazioParaNulo(request.inscricaoEstadual()));
        juridica.setInscricaoMunicipal(vazioParaNulo(request.inscricaoMunicipal()));
        juridica.setObservacao(vazioParaNulo(request.observacao()));
    }

    private PessoaResponse montarResposta(T_Pessoa pessoa) {
        T_PessoaFisica pf = pessoa.getPessoaFisica();
        T_PessoaJuridica pj = pessoa.getPessoaJuridica();
        boolean fisica = pf != null;
        return new PessoaResponse(
                pessoa.getId(), fisica ? TipoPessoa.FISICA : TipoPessoa.JURIDICA, pessoa.isAtivo(),
                pessoa.isCliente(), pessoa.isFornecedor(),
                fisica ? pf.getObservacao() : pj.getObservacao(),
                fisica ? pf.getNome() : null, fisica ? pf.getApelido() : null, fisica ? pf.getCpf() : null,
                fisica ? pf.getRg() : null, fisica ? pf.getSexo() : null, fisica ? pf.getDataNascimento() : null,
                fisica ? pf.getEstadoCivil() : null, fisica ? pf.getProfissao() : null,
                fisica ? null : pj.getRazaoSocial(), fisica ? null : pj.getNomeFantasia(), fisica ? null : pj.getCnpj(),
                fisica ? null : pj.getInscricaoEstadual(), fisica ? null : pj.getInscricaoMunicipal(),
                contatoService.endereco(pessoa.getId()), contatoService.telefones(pessoa.getId()),
                contatoService.emails(pessoa.getId()));
    }

    private Specification<T_Pessoa> especificacao(UUID tenant, FiltroPessoa filtro) {
        return (root, query, cb) -> {
            Join<T_Pessoa, T_PessoaFisica> pf = root.join("pessoaFisica", JoinType.LEFT);
            Join<T_Pessoa, T_PessoaJuridica> pj = root.join("pessoaJuridica", JoinType.LEFT);
            Expression<String> nome = cb.lower(cb.coalesce(pf.<String>get("nome"), pj.<String>get("razaoSocial")));
            Expression<String> apelido = cb.lower(cb.coalesce(pf.<String>get("apelido"), pj.<String>get("nomeFantasia")));
            Expression<String> documento = cb.coalesce(pf.<String>get("cpf"), pj.<String>get("cnpj"));

            List<Predicate> filtros = new ArrayList<>();
            filtros.add(cb.equal(root.get("tenant"), tenant));
            filtros.add(cb.isFalse(root.get("deletado")));

            // so aparecem pessoas marcadas como cliente e/ou fornecedor (funcionarios ficam de fora)
            if ("CLIENTE".equalsIgnoreCase(filtro.papel())) {
                filtros.add(cb.isTrue(root.get("cliente")));
            } else if ("FORNECEDOR".equalsIgnoreCase(filtro.papel())) {
                filtros.add(cb.isTrue(root.get("fornecedor")));
            } else {
                filtros.add(cb.or(cb.isTrue(root.get("cliente")), cb.isTrue(root.get("fornecedor"))));
            }
            if (filtro.tipo() == TipoPessoa.FISICA) {
                filtros.add(cb.isNotNull(root.get("pessoaFisica")));
            } else if (filtro.tipo() == TipoPessoa.JURIDICA) {
                filtros.add(cb.isNotNull(root.get("pessoaJuridica")));
            }

            if (temTexto(filtro.busca())) {
                String padrao = padrao(filtro.busca());
                List<Predicate> ou = new ArrayList<>(List.of(
                        cb.like(nome, padrao, '\\'), cb.like(apelido, padrao, '\\')));
                String digitos = Documentos.soDigitos(filtro.busca());
                if (!digitos.isEmpty()) {
                    ou.add(cb.like(cb.coalesce(documento, ""), "%" + digitos + "%"));
                }
                filtros.add(cb.or(ou.toArray(new Predicate[0])));
            }
            if (temTexto(filtro.nome())) {
                filtros.add(cb.like(nome, padrao(filtro.nome()), '\\'));
            }
            if (temTexto(filtro.documento())) {
                String digitos = Documentos.soDigitos(filtro.documento());
                if (!digitos.isEmpty()) {
                    filtros.add(cb.like(cb.coalesce(documento, ""), "%" + digitos + "%"));
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
