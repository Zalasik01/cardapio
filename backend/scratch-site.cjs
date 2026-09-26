const { edit, escrever } = require('C:/Users/nizal/AppData/Local/Temp/claude/c--Users-nizal-Documents-GitHub-cardapio/5f19ba7a-e78c-4c6e-b494-9cd08549ccc9/scratchpad/ed.cjs')
const J = 'backend/src/main/java/com/cardapio/'

escrever(J + 'entity/T_LojaSite.java', `package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/** Personalização do site (cardápio online) da loja. */
@Entity
@Table(name = "t_loja_site")
@AttributeOverride(name = "id", column = @Column(name = "id_loja_site"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_LojaSite extends TenantAbstract {

    /** Cor da marca em hexadecimal (#RRGGBB); vazio = a cor padrão do cardápio. */
    @Column(length = 7)
    private String corPrimaria;

    private String bannerUrl;

    @Column(length = 1000)
    private String sobre;

    private String instagram;

    private String facebook;

    private String whatsapp;

    /** Aviso em destaque no topo do cardápio (ex.: "Frete grátis hoje!"). */
    @Column(length = 160)
    private String mensagemTopo;

    /** Domínio próprio (ex.: pedidos.minhaloja.com.br), apontado para o sistema. */
    private String dominio;
}
`)

escrever(J + 'repository/T_LojaSiteRepository.java', `package com.cardapio.repository;

import com.cardapio.entity.T_LojaSite;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface T_LojaSiteRepository extends JpaRepository<T_LojaSite, Long> {

    Optional<T_LojaSite> findByTenantAndDeletadoFalse(UUID tenant);

    Optional<T_LojaSite> findFirstByDominioIgnoreCaseAndDeletadoFalse(String dominio);
}
`)

escrever(J + 'service/SiteLojaService.java', `package com.cardapio.service;

import com.cardapio.entity.T_LojaSite;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.T_LojaSiteRepository;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Site da loja: personalização do cardápio online (cor, banner, textos, redes sociais) e domínio próprio. */
@Service
@RequiredArgsConstructor
public class SiteLojaService {

    private static final Pattern COR = Pattern.compile("^#[0-9a-fA-F]{6}$");
    private static final Pattern DOMINIO = Pattern.compile("^(?=.{4,120}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\\\\.)+[a-z]{2,}$");

    private final T_LojaSiteRepository repository;
    private final LojaService lojaService;

    public record SiteRequest(String corPrimaria, String bannerUrl, String sobre, String instagram, String facebook, String whatsapp,
                              String mensagemTopo, String dominio) {
    }

    public record SiteResponse(String corPrimaria, String bannerUrl, String sobre, String instagram, String facebook, String whatsapp,
                               String mensagemTopo, String dominio) {
        static SiteResponse of(T_LojaSite s) {
            return new SiteResponse(s.getCorPrimaria(), s.getBannerUrl(), s.getSobre(), s.getInstagram(), s.getFacebook(), s.getWhatsapp(),
                    s.getMensagemTopo(), s.getDominio());
        }
    }

    /** O que o cardápio público recebe (sem o domínio, que não interessa ao cliente). */
    @Transactional(readOnly = true)
    public SiteResponse publico(UUID tenant) {
        return repository.findByTenantAndDeletadoFalse(tenant).map(s -> SiteResponse.of(s)).orElse(null);
    }

    @Transactional(readOnly = true)
    public SiteResponse obter(UUID tenant) {
        return repository.findByTenantAndDeletadoFalse(tenant).map(SiteResponse::of)
                .orElse(new SiteResponse(null, null, null, null, null, null, null, null));
    }

    @Transactional
    public SiteResponse salvar(UUID tenant, SiteRequest r) {
        String cor = texto(r.corPrimaria());
        if (cor != null && !COR.matcher(cor).matches()) {
            throw new RegraNegocioException("A cor deve estar no formato #RRGGBB");
        }
        String dominio = texto(r.dominio());
        if (dominio != null) {
            dominio = dominio.toLowerCase(Locale.ROOT).replaceFirst("^https?://", "").replaceAll("/.*$", "");
            if (!DOMINIO.matcher(dominio).matches()) {
                throw new RegraNegocioException("Informe um domínio válido, como pedidos.minhaloja.com.br");
            }
            repository.findFirstByDominioIgnoreCaseAndDeletadoFalse(dominio)
                    .filter(outro -> !tenant.equals(outro.getTenant()))
                    .ifPresent(outro -> {
                        throw new RegraNegocioException("Este domínio já está em uso por outra loja");
                    });
        }
        T_LojaSite site = repository.findByTenantAndDeletadoFalse(tenant).orElseGet(() -> T_LojaSite.builder().tenant(tenant).build());
        site.setCorPrimaria(cor == null ? null : cor.toLowerCase(Locale.ROOT));
        site.setBannerUrl(texto(r.bannerUrl()));
        site.setSobre(texto(r.sobre()));
        site.setInstagram(arroba(r.instagram()));
        site.setFacebook(texto(r.facebook()));
        site.setWhatsapp(r.whatsapp() == null ? null : texto(r.whatsapp().replaceAll("\\\\D", "")));
        site.setMensagemTopo(texto(r.mensagemTopo()));
        site.setDominio(dominio);
        return SiteResponse.of(repository.save(site));
    }

    /** Domínio próprio -> slug da loja (o site abre o cardápio dela na raiz do domínio). */
    @Transactional(readOnly = true)
    public Optional<String> slugDoDominio(String host) {
        if (host == null || host.isBlank()) {
            return Optional.empty();
        }
        return repository.findFirstByDominioIgnoreCaseAndDeletadoFalse(host.trim())
                .map(s -> lojaService.buscarPorTenant(s.getTenant()).getSlug());
    }

    private static String texto(String v) {
        return v == null || v.isBlank() ? null : v.trim();
    }

    private static String arroba(String v) {
        String t = texto(v);
        return t == null ? null : t.replaceFirst("^@", "").replaceFirst("^https?://(www\\\\.)?instagram\\\\.com/", "").replaceAll("/.*$", "");
    }
}
`)

escrever(J + 'controller/admin/AdminSiteController.java', `package com.cardapio.controller.admin;

import com.cardapio.service.SiteLojaService;
import com.cardapio.service.SiteLojaService.SiteRequest;
import com.cardapio.service.SiteLojaService.SiteResponse;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** Personalização do site da loja. O acesso ao tenant da URL é validado no SecurityConfig. */
@RestController
@RequestMapping("/api/admin/lojas/{tenant}/site")
@RequiredArgsConstructor
public class AdminSiteController {

    private final SiteLojaService service;

    @PreAuthorize("@perm.tem('SITE_LEITURA')")
    @GetMapping
    public SiteResponse obter(@PathVariable UUID tenant) {
        return service.obter(tenant);
    }

    @PreAuthorize("@perm.tem('SITE_ALTERAR')")
    @PutMapping
    public SiteResponse salvar(@PathVariable UUID tenant, @RequestBody SiteRequest request) {
        return service.salvar(tenant, request);
    }
}
`)

edit(J + 'controller/CardapioPublicoController.java', [
  ['    @GetMapping("/lojas/{slug}/cardapio")', `    /** Domínio próprio da loja -> slug (o frontend abre o cardápio na raiz do domínio). */
    @GetMapping("/lojas/por-dominio")
    public java.util.Map<String, String> porDominio(@RequestParam String host) {
        return siteService.slugDoDominio(host).map(s -> java.util.Map.of("slug", s))
                .orElseThrow(() -> new com.cardapio.exception.RecursoNaoEncontradoException("Domínio não cadastrado"));
    }

    @GetMapping("/lojas/{slug}/cardapio")`],
  ['    private final CardapioService cardapioService;', '    private final CardapioService cardapioService;\n    private final com.cardapio.service.SiteLojaService siteService;'],
])
edit(J + 'dto/cardapio/CardapioResponse.java', [
  ['        java.math.BigDecimal avaliacaoMedia,\n', '        java.math.BigDecimal avaliacaoMedia,\n        com.cardapio.service.SiteLojaService.SiteResponse site,\n'],
])
edit(J + 'service/CardapioService.java', [
  ['    private final FidelidadeService fidelidadeService;', '    private final FidelidadeService fidelidadeService;\n    private final SiteLojaService siteService;'],
  ['resumoAvaliacao.total() == 0 ? null : resumoAvaliacao.mediaLoja(), fidelidadeService.percentual(tenant),', 'resumoAvaliacao.total() == 0 ? null : resumoAvaliacao.mediaLoja(), siteService.publico(tenant), fidelidadeService.percentual(tenant),'],
])
