package com.cardapio.service;

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
    private static final Pattern DOMINIO = Pattern.compile("^(?=.{4,120}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,}$");

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
        site.setWhatsapp(r.whatsapp() == null ? null : texto(r.whatsapp().replaceAll("\\D", "")));
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
        return t == null ? null : t.replaceFirst("^@", "").replaceFirst("^https?://(www\\.)?instagram\\.com/", "").replaceAll("/.*$", "");
    }
}
