import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import BotaoDica from '../BotaoDica'
import { dataParaHora, DIAS_SEMANA, horaParaData } from '../../utils/funcionamento'

/**
 * Editor do horário de funcionamento: uma linha por dia da semana, cada uma com um ou mais intervalos
 * (ex.: almoço e jantar). Sem intervalo, o dia é "Fechado". Se o fechamento é menor que a abertura, o
 * intervalo termina no dia seguinte (ex.: 18:00 às 02:00).
 *
 * Props: horarios [{ diaSemana, abre, fecha }] (horas "HH:mm") e aoAlterar(novaLista).
 */
export default function HorarioFuncionamento({ horarios, aoAlterar }) {
  const doDia = (dia) => horarios.filter((h) => h.diaSemana === dia)

  // troca a lista do dia mantendo os demais dias
  const substituirDia = (dia, intervalos) =>
    aoAlterar([...horarios.filter((h) => h.diaSemana !== dia), ...intervalos.map((i) => ({ ...i, diaSemana: dia }))])

  function alterarIntervalo(dia, indice, campo, data) {
    const intervalos = doDia(dia).map((i, posicao) => (posicao === indice ? { ...i, [campo]: dataParaHora(data) } : i))
    substituirDia(dia, intervalos)
  }

  function adicionar(dia) {
    const existentes = doDia(dia)
    // sugere o intervalo seguinte: depois do último que existe, senão o padrão comercial
    const novo = existentes.length ? { abre: '18:00', fecha: '22:00' } : { abre: '11:00', fecha: '15:00' }
    substituirDia(dia, [...existentes, novo])
  }

  function copiarParaTodos(dia) {
    const modelo = doDia(dia)
    aoAlterar(DIAS_SEMANA.flatMap((d) => modelo.map((i) => ({ ...i, diaSemana: d.valor }))))
  }

  return (
    <div className="horario">
      {DIAS_SEMANA.map((dia) => {
        const intervalos = doDia(dia.valor)
        return (
          <div key={dia.valor} className="horario__dia">
            <span className="horario__nome">{dia.rotulo}</span>

            <div className="horario__intervalos">
              {intervalos.length === 0 && <span className="horario__fechado">Fechado</span>}
              {intervalos.map((intervalo, indice) => (
                <div key={indice} className="horario__intervalo">
                  <Calendar value={horaParaData(intervalo.abre)} timeOnly hourFormat="24" aria-label={`${dia.rotulo}: abre`}
                            onChange={(e) => alterarIntervalo(dia.valor, indice, 'abre', e.value)} />
                  <span>às</span>
                  <Calendar value={horaParaData(intervalo.fecha)} timeOnly hourFormat="24" aria-label={`${dia.rotulo}: fecha`}
                            onChange={(e) => alterarIntervalo(dia.valor, indice, 'fecha', e.value)} />
                  <Button type="button" icon="pi pi-trash" rounded text severity="danger" size="small"
                          aria-label={`Remover intervalo de ${dia.rotulo}`}
                          onClick={() => substituirDia(dia.valor, intervalos.filter((_, posicao) => posicao !== indice))} />
                </div>
              ))}
            </div>

            <span className="horario__acoes">
              <BotaoDica type="button" icon="pi pi-plus" rounded text size="small" aria-label={`Adicionar intervalo em ${dia.rotulo}`}
                          dica="Adicionar intervalo" posicao="left" onClick={() => adicionar(dia.valor)} />
              {intervalos.length > 0 && (
                <BotaoDica type="button" icon="pi pi-copy" rounded text severity="secondary" size="small"
                        aria-label={`Copiar o horário de ${dia.rotulo} para todos os dias`}
                        dica="Copiar para todos os dias" posicao="left"
                        onClick={() => copiarParaTodos(dia.valor)} />
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}
