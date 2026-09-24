import { Calendar } from 'primereact/calendar'
import { diasDoPeriodo, hojeSemHora, LIMITE_DIAS, PRESETS_PERIODO, somarDias } from '../../utils/periodo'

const formatar = (data) => data.toLocaleDateString('pt-BR')

/**
 * Seletor de período (padrão de todo filtro de período): atalhos em lista ("Hoje", "Últimos 7 dias"...) ao
 * lado de um calendário em que se clica na primeira data e depois na segunda. O período tem no máximo 90
 * dias e não passa de hoje: depois do primeiro clique, o calendário só libera as datas que respeitam isso.
 *
 * Props:
 *  - selecao: [inicio, fim | null] (Date) — a seleção em andamento
 *  - presetAtivo: id do atalho escolhido (destaca o botão) ou null
 *  - aoAlterar(selecao, presetId?): chamado a cada clique no calendário (presetId nulo) ou em atalho
 */
export default function SeletorPeriodo({ selecao, presetAtivo, aoAlterar }) {
  const hoje = hojeSemHora()
  const [inicio, fim] = selecao ?? []
  const esperandoFim = inicio && !fim

  // depois do 1º clique só cabem as datas a até 89 dias dele (e nunca depois de hoje)
  const minimo = esperandoFim ? somarDias(inicio, -(LIMITE_DIAS - 1)) : undefined
  const maximoNaJanela = esperandoFim ? somarDias(inicio, LIMITE_DIAS - 1) : hoje
  const maximo = maximoNaJanela < hoje ? maximoNaJanela : hoje

  const dias = inicio && fim ? diasDoPeriodo(inicio, fim) : null

  return (
    <div className="seletor-periodo">
      <ul className="seletor-periodo__atalhos" role="radiogroup" aria-label="Atalhos de período">
        {PRESETS_PERIODO.map((preset) => (
          <li key={preset.id}>
            <button
              type="button"
              role="radio"
              aria-checked={presetAtivo === preset.id}
              className={`seletor-periodo__atalho ${presetAtivo === preset.id ? 'seletor-periodo__atalho--ativo' : ''}`}
              onClick={() => aoAlterar(preset.calcular(hoje), preset.id)}
            >
              <span className="seletor-periodo__radio" aria-hidden="true" />
              {preset.rotulo}
            </button>
          </li>
        ))}
      </ul>

      <div className="seletor-periodo__calendario">
        <Calendar
          inline
          selectionMode="range"
          value={selecao}
                    minDate={minimo}
          maxDate={maximo}
          onChange={(e) => aoAlterar(e.value)}
        />
        <p className="seletor-periodo__resumo" aria-live="polite">
          {esperandoFim && `Início: ${formatar(inicio)}. Clique na data final (até ${LIMITE_DIAS} dias).`}
          {dias && `${formatar(inicio)} a ${formatar(fim)} · ${dias} ${dias === 1 ? 'dia' : 'dias'}`}
          {!inicio && `Clique na data inicial e depois na final. Máximo de ${LIMITE_DIAS} dias.`}
        </p>
      </div>
    </div>
  )
}
