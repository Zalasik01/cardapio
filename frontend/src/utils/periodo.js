import { dataParaIso, isoParaData } from './formatadores'

/** Regra padrão de todo filtro de período: no máximo 90 dias (início e fim inclusive). */
export const LIMITE_DIAS = 90

export const somarDias = (data, dias) => new Date(data.getFullYear(), data.getMonth(), data.getDate() + dias)
const primeiroDiaDoMes = (data, deslocamento = 0) => new Date(data.getFullYear(), data.getMonth() + deslocamento, 1)
const ultimoDiaDoMes = (data, deslocamento = 0) => new Date(data.getFullYear(), data.getMonth() + deslocamento + 1, 0)

/** Atalhos oferecidos no seletor. calcular(hoje) devolve [inicio, fim]; todos respeitam o limite de 90 dias. */
export const PRESETS_PERIODO = [
  { id: 'hoje', rotulo: 'Hoje', calcular: (h) => [h, h] },
  { id: 'ontem', rotulo: 'Ontem', calcular: (h) => [somarDias(h, -1), somarDias(h, -1)] },
  { id: 'semana-corrente', rotulo: 'Semana corrente', calcular: (h) => [somarDias(h, -((h.getDay() + 6) % 7)), h] },
  { id: 'mes-corrente', rotulo: 'Mês corrente', calcular: (h) => [primeiroDiaDoMes(h), h] },
  { id: 'mes-passado', rotulo: 'Mês passado', calcular: (h) => [primeiroDiaDoMes(h, -1), ultimoDiaDoMes(h, -1)] },
  { id: 'ultimos-7', rotulo: 'Últimos 7 dias', calcular: (h) => [somarDias(h, -6), h] },
  { id: 'ultimos-10', rotulo: 'Últimos 10 dias', calcular: (h) => [somarDias(h, -9), h] },
  { id: 'ultimos-30', rotulo: 'Últimos 30 dias', calcular: (h) => [somarDias(h, -29), h] },
  { id: 'ultimos-60', rotulo: 'Últimos 60 dias', calcular: (h) => [somarDias(h, -59), h] },
  { id: 'ultimos-90', rotulo: 'Últimos 90 dias', calcular: (h) => [somarDias(h, -(LIMITE_DIAS - 1)), h] },
]

export const hojeSemHora = () => {
  const agora = new Date()
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
}

/** Número de dias do período, contando o início e o fim. */
export const diasDoPeriodo = (inicio, fim) => Math.round((fim - inicio) / 86400000) + 1

/**
 * Período guardado nas preferências: { preset } (relativo a hoje, acompanha os dias) ou { inicio, fim }
 * em ISO (yyyy-MM-dd). Devolve { inicio, fim } como Date, ou o padrão se o valor for inválido.
 */
export function resolverPeriodo(periodo, padrao) {
  const hoje = hojeSemHora()
  if (periodo?.preset) {
    const preset = PRESETS_PERIODO.find((p) => p.id === periodo.preset)
    if (preset) {
      const [inicio, fim] = preset.calcular(hoje)
      return { inicio, fim }
    }
  }
  if (periodo?.inicio && periodo?.fim) {
    const inicio = isoParaData(periodo.inicio)
    const fim = isoParaData(periodo.fim)
    if (inicio <= fim && diasDoPeriodo(inicio, fim) <= LIMITE_DIAS) return { inicio, fim }
  }
  return padrao ? resolverPeriodo(padrao) : resolverPeriodo({ preset: 'hoje' })
}

const formatar = (data) => data.toLocaleDateString('pt-BR')

/** Texto do período: o nome do atalho quando é um, senão "dd/mm/aaaa a dd/mm/aaaa". */
export function rotuloPeriodo(periodo, resolvido) {
  const preset = PRESETS_PERIODO.find((p) => p.id === periodo?.preset)
  if (preset) return preset.rotulo
  return resolvido.inicio.getTime() === resolvido.fim.getTime()
    ? formatar(resolvido.inicio)
    : `${formatar(resolvido.inicio)} a ${formatar(resolvido.fim)}`
}

/** Período no formato da API: { inicio, fim } em ISO. */
export const periodoParaIso = ({ inicio, fim }) => ({ inicio: dataParaIso(inicio), fim: dataParaIso(fim) })
