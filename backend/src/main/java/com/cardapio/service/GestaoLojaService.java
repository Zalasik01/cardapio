package com.cardapio.service;

import com.cardapio.dto.PaginaResponse;
import com.cardapio.dto.funcionario.EmailDto;
import com.cardapio.dto.funcionario.TelefoneDto;
import com.cardapio.dto.gestao.FiltroLojaGestao;
import com.cardapio.dto.gestao.LojaGestaoRequest;
import com.cardapio.dto.gestao.LojaGestaoResponse;
import com.cardapio.dto.gestao.LojaGestaoResumoResponse;
import com.cardapio.entity.S_Loja;
import com.cardapio.entity.S_LojaEmail;
import com.cardapio.entity.S_LojaTelefone;
import com.cardapio.exception.RecursoNaoEncontradoException;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.S_LojaEmailRepository;
import com.cardapio.repository.S_LojaRepository;
import com.cardapio.repository.S_LojaTelefoneRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Gestão Interna: cadastro das lojas da plataforma (s_loja). Só o usuário administrador acessa (SecurityConfig). */
@Service
@RequiredArgsConstructor
public class GestaoLojaService {

    private static final int TAMANHO_MAXIMO_PAGINA = 50;

    private final S_LojaRepository lojaRepository;
    private final S_LojaTelefoneRepository telefoneRepository;
    private final S_LojaEmailRepository emailRepository;

    @Transactional(readOnly = true)
    public PaginaResponse<LojaGestaoResumoResponse> buscar(FiltroLojaGestao filtro, int pagina, int tamanho) {
        int tamanhoLimitado = Math.min(Math.max(tamanho, 1), TAMANHO_MAXIMO_PAGINA);
        var resultado = lojaRepository.findAll(especificacao(filtro), PageRequest.of(Math.max(pagina, 0), tamanhoLimitado));
        return PaginaResponse.of(resultado, LojaGestaoResumoResponse::of);
    }

    @Transactional(readOnly = true)
    public LojaGestaoResponse obter(Long id) {
        return resposta(buscarLoja(id));
    }

    @Transactional
    public LojaGestaoResponse criar(LojaGestaoRequest request) {
        if (lojaRepository.existsBySlug(request.slug())) {
            throw new RegraNegocioException("Já existe uma loja com o endereço (slug): " + request.slug());
        }
        validarCnpjLivre(request.cnpj(), null);
        S_Loja loja = S_Loja.builder().build();
        preencher(loja, request);
        loja = lojaRepository.save(loja);
        salvarContatos(loja, request);
        return resposta(loja);
    }

    @Transactional
    public LojaGestaoResponse atualizar(Long id, LojaGestaoRequest request) {
        S_Loja loja = buscarLoja(id);
        if (!loja.getSlug().equals(request.slug()) && lojaRepository.existsBySlug(request.slug())) {
            throw new RegraNegocioException("Já existe uma loja com o endereço (slug): " + request.slug());
        }
        validarCnpjLivre(request.cnpj(), loja.getId());
        preencher(loja, request);
        loja = lojaRepository.save(loja);
        salvarContatos(loja, request);
        return resposta(loja);
    }

    /** Exclusão lógica; o slug é liberado para uma nova loja usá-lo. */
    @Transactional
    public void excluir(Long id) {
        S_Loja loja = buscarLoja(id);
        loja.setSlug(loja.getSlug() + "-excluida-" + loja.getId());
        loja.setDeletado(true);
        loja.setAtivo(false);
        lojaRepository.save(loja);
    }

    /**
     * Os contatos enviados substituem os anteriores (lista nula = não mexer). O primeiro telefone é copiado
     * para s_loja.telefone, que o cardápio público exibe.
     */
    private void salvarContatos(S_Loja loja, LojaGestaoRequest request) {
        if (request.telefones() != null) {
            telefoneRepository.deleteByLojaId(loja.getId());
            telefoneRepository.flush();
            telefoneRepository.saveAll(request.telefones().stream()
                    .map(dto -> S_LojaTelefone.builder().loja(loja).tipo(dto.tipo()).numero(dto.numero().trim())
                            .observacao(vazioParaNulo(dto.observacao())).build())
                    .toList());
            loja.setTelefone(request.telefones().isEmpty() ? null : request.telefones().get(0).numero().trim());
            lojaRepository.save(loja);
        }
        if (request.emails() != null) {
            emailRepository.deleteByLojaId(loja.getId());
            emailRepository.flush();
            emailRepository.saveAll(request.emails().stream()
                    .map(dto -> S_LojaEmail.builder().loja(loja).email(dto.email().trim().toLowerCase(Locale.ROOT))
                            .observacao(vazioParaNulo(dto.observacao())).build())
                    .toList());
        }
    }

    private LojaGestaoResponse resposta(S_Loja loja) {
        List<TelefoneDto> telefones = telefoneRepository.findByLojaIdOrderByIdAsc(loja.getId()).stream()
                .map(t -> new TelefoneDto(t.getTipo(), t.getNumero(), t.getObservacao())).toList();
        List<EmailDto> emails = emailRepository.findByLojaIdOrderByIdAsc(loja.getId()).stream()
                .map(e -> new EmailDto(e.getEmail(), e.getObservacao())).toList();
        return LojaGestaoResponse.of(loja, telefones, emails);
    }

    private S_Loja buscarLoja(Long id) {
        return lojaRepository.findById(id)
                .filter(loja -> !loja.isDeletado())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Loja não encontrada"));
    }

    private void preencher(S_Loja loja, LojaGestaoRequest r) {
        if (r.ativo() != null) {
            loja.setAtivo(r.ativo());
        }
        loja.setNome(r.nome().trim());
        loja.setSlug(r.slug());
        loja.setTipoOrganizacao(r.tipoOrganizacao());
        loja.setSituacaoConta(r.situacaoConta());
        loja.setDescricao(vazioParaNulo(r.descricao()));
        loja.setLogoUrl(vazioParaNulo(r.logoUrl()));
        loja.setEnderecoRua(vazioParaNulo(r.enderecoRua()));
        loja.setEnderecoNumero(vazioParaNulo(r.enderecoNumero()));
        loja.setEnderecoComplemento(vazioParaNulo(r.enderecoComplemento()));
        loja.setEnderecoBairro(vazioParaNulo(r.enderecoBairro()));
        loja.setEnderecoCidade(vazioParaNulo(r.enderecoCidade()));
        String estado = vazioParaNulo(r.enderecoEstado());
        loja.setEnderecoEstado(estado == null ? null : estado.toUpperCase(Locale.ROOT));
        loja.setEnderecoCep(vazioParaNulo(r.enderecoCep()));
        String cnpj = Documentos.soDigitos(r.cnpj());
        loja.setCnpj(cnpj == null || cnpj.isEmpty() ? null : cnpj);
        loja.setValorMensalidade(r.valorMensalidade() != null ? r.valorMensalidade() : BigDecimal.ZERO);
        loja.setDiaVencimento(r.diaVencimento());
        // a taxa de entrega, o valor mínimo e a localização são da própria loja ("Minha loja"), não da gestão
    }

    /** O CNPJ identifica a empresa: só uma loja (não excluída) pode usá-lo. lojaId é a loja em edição, se houver. */
    private void validarCnpjLivre(String cnpjInformado, Long lojaId) {
        String cnpj = Documentos.soDigitos(cnpjInformado);
        if (cnpj == null || cnpj.isEmpty()) {
            return;
        }
        boolean emUso = lojaId == null
                ? lojaRepository.existsByCnpjAndDeletadoFalse(cnpj)
                : lojaRepository.existsByCnpjAndDeletadoFalseAndIdNot(cnpj, lojaId);
        if (emUso) {
            throw new RegraNegocioException("Já existe uma loja com este CNPJ");
        }
    }

    private Specification<S_Loja> especificacao(FiltroLojaGestao filtro) {
        return (root, query, cb) -> {
            List<Predicate> filtros = new ArrayList<>();
            filtros.add(cb.isFalse(root.get("deletado")));
            // por padrão só lista lojas ativas; "Mostrar inativos" inclui as demais
            if (!filtro.mostrarInativos()) {
                filtros.add(cb.isTrue(root.get("ativo")));
            }
            if (filtro.busca() != null && !filtro.busca().isBlank()) {
                String padrao = "%" + filtro.busca().trim().toLowerCase(Locale.ROOT)
                        .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                filtros.add(cb.or(
                        cb.like(cb.lower(root.get("nome")), padrao, '\\'),
                        cb.like(cb.lower(root.get("slug")), padrao, '\\')));
            }
            if (filtro.situacaoConta() != null) {
                filtros.add(cb.equal(root.get("situacaoConta"), filtro.situacaoConta()));
            }
            if (filtro.tipoOrganizacao() != null) {
                filtros.add(cb.equal(root.get("tipoOrganizacao"), filtro.tipoOrganizacao()));
            }
            if (query.getResultType() != Long.class) {
                query.orderBy(cb.asc(cb.lower(root.get("nome"))));
            }
            return cb.and(filtros.toArray(new Predicate[0]));
        };
    }

    private String vazioParaNulo(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
