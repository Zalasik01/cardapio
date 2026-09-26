package com.cardapio.dto.cardapio;

import com.cardapio.entity.T_Produto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Produto como o cliente vê no cardápio. "indisponivel" = aparece, mas não pode ser pedido agora (esgotado ou fora do
 * horário); motivoIndisponivel diz por quê. precoOriginal só vem quando há promoção valendo agora.
 */
public record ProdutoResponse(
        UUID guid,
        UUID categoriaGuid,
        String categoriaNome,
        String nome,
        String descricao,
        BigDecimal preco,
        BigDecimal precoOriginal,
        boolean destaque,
        String imagemUrl,
        boolean disponivel,
        Integer ordemExibicao,
        boolean indisponivel,
        String motivoIndisponivel,
        List<String> selos,
        String alergenos,
        String promocaoQuando,
        List<com.cardapio.service.OpcaoService.GrupoPublico> grupos
) {
    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");
    private static final String[] DIAS = {"", "seg", "ter", "qua", "qui", "sex", "sáb", "dom"};

    /** agora = data/hora na loja (a promoção por horário e a disponibilidade dependem dela). */
    public static ProdutoResponse of(T_Produto p, LocalDateTime agora, List<com.cardapio.service.OpcaoService.GrupoPublico> grupos) {
        boolean esgotado = p.esgotado(agora);
        boolean fora = !esgotado && p.foraDoHorario(agora);
        String motivo = esgotado ? "Esgotado hoje"
                : fora ? "Disponível " + janela(p.getDisponivelDias(), p.getDisponivelDas(), p.getDisponivelAte()) : null;
        boolean promo = p.emPromocao(agora);
        return new ProdutoResponse(
                p.getGuid(), p.getCategoria().getGuid(), p.getCategoria().getNome(), p.getNome(), p.getDescricao(),
                p.precoVenda(agora), promo ? p.getPreco() : null, p.isDestaque(), p.getImagemUrl(), p.isDisponivel(),
                p.getOrdemExibicao(), esgotado || fora, motivo, lista(p.getSelos()),
                p.getAlergenos() == null || p.getAlergenos().isBlank() ? null : p.getAlergenos(),
                promo && (p.getPromoInicio() != null || (p.getPromoDias() != null && !p.getPromoDias().isBlank()))
                        ? "Promoção " + janela(p.getPromoDias(), p.getPromoInicio(), p.getPromoFim()) : null,
                grupos == null ? List.of() : grupos);
    }

    private static List<String> lista(String csv) {
        return csv == null || csv.isBlank() ? List.of() : Arrays.stream(csv.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    /** "seg a sex, das 17:00 às 19:00". */
    static String janela(String dias, LocalTime de, LocalTime ate) {
        String d = dias == null || dias.isBlank() ? "" : nomesDosDias(dias);
        String h = de != null && ate != null ? "das " + de.format(HORA) + " às " + ate.format(HORA) : "";
        return (d + (d.isEmpty() || h.isEmpty() ? "" : ", ") + h).trim();
    }

    private static String nomesDosDias(String csv) {
        List<Integer> dias = Arrays.stream(csv.split(",")).map(String::trim).filter(s -> s.matches("[1-7]")).map(Integer::parseInt).sorted().toList();
        if (dias.isEmpty()) return "";
        boolean seguidos = dias.size() > 2 && dias.get(dias.size() - 1) - dias.get(0) == dias.size() - 1;
        if (dias.size() == 7) return "todos os dias";
        if (seguidos) return DIAS[dias.get(0)] + " a " + DIAS[dias.get(dias.size() - 1)];
        return String.join(", ", dias.stream().map(i -> DIAS[i]).toList());
    }
}
