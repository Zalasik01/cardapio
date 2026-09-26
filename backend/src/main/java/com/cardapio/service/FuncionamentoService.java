package com.cardapio.service;

import com.cardapio.dto.funcionamento.FuncionamentoRequest;
import com.cardapio.dto.funcionamento.FuncionamentoRequest.HorarioDto;
import com.cardapio.dto.funcionamento.FuncionamentoResponse;
import com.cardapio.entity.ModoFuncionamento;
import com.cardapio.entity.S_Loja;
import com.cardapio.entity.S_LojaHorario;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.S_LojaHorarioRepository;
import com.cardapio.repository.S_LojaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * Horário de funcionamento e estado (aberta/fechada) da loja. No modo AUTOMATICO a loja segue os intervalos
 * cadastrados (no fuso dela); ABERTA e FECHADA forçam o estado. Sem nenhum intervalo cadastrado, a loja é
 * tratada como sempre aberta, para não travar lojas que ainda não configuraram o horário.
 */
@Service
@RequiredArgsConstructor
public class FuncionamentoService {

    /** Quantos dias à frente procurar a próxima abertura/fechamento. */
    private static final int DIAS_A_FRENTE = 8;

    private final S_LojaRepository lojaRepository;
    private final S_LojaHorarioRepository horarioRepository;
    private final LojaService lojaService;
    private final com.cardapio.repository.T_PedidoRepository pedidoRepository;

    private record Intervalo(LocalDateTime inicio, LocalDateTime fim) {
        boolean contem(LocalDateTime momento) {
            return !momento.isBefore(inicio) && momento.isBefore(fim);
        }
    }

    @Transactional(readOnly = true)
    public FuncionamentoResponse obter(UUID tenant) {
        S_Loja loja = lojaService.buscarPorTenant(tenant);
        return situacao(loja, true);
    }

    /** Só o estado atual (sem a lista de horários): usado pelo selo do cabeçalho. */
    @Transactional(readOnly = true)
    public FuncionamentoResponse situacao(UUID tenant) {
        return situacao(lojaService.buscarPorTenant(tenant), false);
    }

    /** A loja está aberta agora? Usado para aceitar ou recusar pedidos. */
    @Transactional(readOnly = true)
    public boolean estaAberta(S_Loja loja) {
        return situacao(loja, false).aberta();
    }

    @Transactional
    public FuncionamentoResponse salvar(UUID tenant, FuncionamentoRequest request) {
        S_Loja loja = lojaService.buscarPorTenant(tenant);
        List<HorarioDto> horarios = request.horarios() == null ? List.of() : request.horarios();
        validarSemSobreposicao(horarios);

        loja.setModoFuncionamento(request.modo());
        lojaRepository.save(loja);
        horarioRepository.deleteByLojaId(loja.getId());
        horarioRepository.flush();
        horarioRepository.saveAll(horarios.stream()
                .map(h -> S_LojaHorario.builder().loja(loja).diaSemana(h.diaSemana().shortValue()).abre(h.abre()).fecha(h.fecha()).build())
                .toList());
        return situacao(loja, true);
    }

    /** Troca só o modo (abrir/fechar agora ou voltar ao automático), sem mexer nos horários. */
    @Transactional
    public FuncionamentoResponse alterarModo(UUID tenant, ModoFuncionamento modo) {
        S_Loja loja = lojaService.buscarPorTenant(tenant);
        loja.setModoFuncionamento(modo);
        lojaRepository.save(loja);
        return situacao(loja, false);
    }

    private FuncionamentoResponse situacao(S_Loja loja, boolean comHorarios) {
        List<S_LojaHorario> horarios = horarioRepository.findByLojaIdOrderByDiaSemanaAscAbreAsc(loja.getId());
        List<HorarioDto> lista = comHorarios
                ? horarios.stream().map(h -> new HorarioDto((int) h.getDiaSemana(), h.getAbre(), h.getFecha())).toList()
                : null;
        ModoFuncionamento modo = loja.getModoFuncionamento();

        if (modo != ModoFuncionamento.AUTOMATICO) {
            return montar(loja, modo, modo == ModoFuncionamento.ABERTA, horarios.isEmpty(), null, lista);
        }
        if (horarios.isEmpty()) {
            return montar(loja, modo, true, true, null, lista);
        }

        LocalDateTime agora = LocalDateTime.now(ZoneId.of(loja.getFusoHorario()));
        List<Intervalo> intervalos = intervalos(horarios, agora.toLocalDate());
        Intervalo atual = intervalos.stream().filter(i -> i.contem(agora)).findFirst().orElse(null);
        if (atual != null) {
            return montar(loja, modo, true, false, atual.fim(), lista);
        }
        LocalDateTime proxima = intervalos.stream().map(Intervalo::inicio).filter(i -> i.isAfter(agora))
                .min(Comparator.naturalOrder()).orElse(null);
        return montar(loja, modo, false, false, proxima, lista);
    }

    /**
     * Monta a resposta somando ao horário duas travas temporárias: a pausa manual ("cozinha cheia, volto em 30 min")
     * e o limite de pedidos em preparo. Com qualquer uma ativa a loja não recebe pedidos, mesmo dentro do horário.
     */
    private FuncionamentoResponse montar(S_Loja loja, ModoFuncionamento modo, boolean aberta, boolean semHorarios,
                                         LocalDateTime proxima, List<HorarioDto> lista) {
        LocalDateTime agora = LocalDateTime.now(ZoneId.of(loja.getFusoHorario()));
        LocalDateTime pausadoAte = loja.getPedidosPausadosAte() != null && agora.isBefore(loja.getPedidosPausadosAte())
                ? loja.getPedidosPausadosAte() : null;
        String motivo = null;
        if (pausadoAte != null) {
            motivo = "PAUSADA";
        } else if (loja.getLimitePedidosEmPreparo() != null && pedidoRepository.countByTenantAndDeletadoFalseAndStatusIn(
                loja.getGuid(), List.of(com.cardapio.entity.StatusPedido.PENDENTE, com.cardapio.entity.StatusPedido.CONFIRMADO,
                        com.cardapio.entity.StatusPedido.EM_PREPARO)) >= loja.getLimitePedidosEmPreparo()) {
            motivo = "LOTADA";
        }
        return new FuncionamentoResponse(modo, aberta && motivo == null, semHorarios, proxima, lista, pausadoAte,
                loja.getLimitePedidosEmPreparo(), aberta ? motivo : null);
    }

    /** Pausa os pedidos por alguns minutos (ou retoma, com minutos vazio). */
    @Transactional
    public FuncionamentoResponse pausar(UUID tenant, Integer minutos) {
        S_Loja loja = lojaService.buscarPorTenant(tenant);
        if (minutos != null && (minutos < 1 || minutos > 720)) {
            throw new RegraNegocioException("A pausa deve ser de 1 a 720 minutos");
        }
        loja.setPedidosPausadosAte(minutos == null ? null : LocalDateTime.now(ZoneId.of(loja.getFusoHorario())).plusMinutes(minutos));
        lojaRepository.save(loja);
        return situacao(loja, false);
    }

    /** Limite de pedidos em preparo (vazio = sem limite). */
    @Transactional
    public FuncionamentoResponse definirLimite(UUID tenant, Integer limite) {
        S_Loja loja = lojaService.buscarPorTenant(tenant);
        if (limite != null && limite < 1) {
            throw new RegraNegocioException("O limite deve ser de pelo menos 1 pedido");
        }
        loja.setLimitePedidosEmPreparo(limite);
        lojaRepository.save(loja);
        return situacao(loja, true);
    }

    /** Intervalos concretos (com data) do dia anterior até DIAS_A_FRENTE dias adiante: o anterior pega quem passa da meia-noite. */
    private List<Intervalo> intervalos(List<S_LojaHorario> horarios, LocalDate hoje) {
        List<Intervalo> resultado = new ArrayList<>();
        for (int deslocamento = -1; deslocamento <= DIAS_A_FRENTE; deslocamento++) {
            LocalDate data = hoje.plusDays(deslocamento);
            for (S_LojaHorario h : horarios) {
                if (h.getDiaSemana() == data.getDayOfWeek().getValue()) {
                    resultado.add(intervalo(data, h.getAbre(), h.getFecha()));
                }
            }
        }
        return resultado;
    }

    private Intervalo intervalo(LocalDate data, java.time.LocalTime abre, java.time.LocalTime fecha) {
        LocalDateTime inicio = data.atTime(abre);
        LocalDateTime fim = fecha.isAfter(abre) ? data.atTime(fecha) : data.plusDays(1).atTime(fecha);
        return new Intervalo(inicio, fim);
    }

    /** Dois intervalos do mesmo dia não podem se cruzar (considerando os que passam da meia-noite). */
    private void validarSemSobreposicao(List<HorarioDto> horarios) {
        // uma semana fictícia (segunda = 1): compara todos os intervalos na mesma linha do tempo
        LocalDate segunda = LocalDate.of(2024, 1, 1);
        List<Intervalo> todos = new ArrayList<>();
        for (HorarioDto h : horarios) {
            if (h.abre().equals(h.fecha())) {
                throw new RegraNegocioException("O horário de abertura e o de fechamento não podem ser iguais");
            }
            todos.add(intervalo(segunda.plusDays(h.diaSemana() - 1L), h.abre(), h.fecha()));
        }
        // o último dia pode passar para a "próxima segunda": também vale contra o início da semana
        List<Intervalo> comCiclo = new ArrayList<>(todos);
        todos.forEach(i -> comCiclo.add(new Intervalo(i.inicio().plusDays(7), i.fim().plusDays(7))));
        comCiclo.sort(Comparator.comparing(Intervalo::inicio));
        for (int i = 1; i < comCiclo.size(); i++) {
            if (comCiclo.get(i).inicio().isBefore(comCiclo.get(i - 1).fim())) {
                throw new RegraNegocioException("Há horários de funcionamento que se sobrepõem no mesmo dia");
            }
        }
    }
}
