/** Regras de exibição do funcionamento da loja (dias da semana, modos e o texto do selo do cabeçalho). */

export const MODOS_FUNCIONAMENTO = [
  { valor: 'AUTOMATICO', rotulo: 'Automático', descricao: 'Abre e fecha sozinha, seguindo o horário de funcionamento.' },
  { valor: 'ABERTA', rotulo: 'Sempre aberta', descricao: 'Fica aberta, ignorando o horário, até você mudar.' },
  { valor: 'FECHADA', rotulo: 'Sempre fechada', descricao: 'Fica fechada e não recebe pedidos, ignorando o horário, até você mudar.' },
]

/** Segunda (1) a domingo (7), na ordem em que aparecem na tela. */
export const DIAS_SEMANA = [
  { valor: 1, rotulo: 'Segunda-feira', curto: 'seg' },
  { valor: 2, rotulo: 'Terça-feira', curto: 'ter' },
  { valor: 3, rotulo: 'Quarta-feira', curto: 'qua' },
  { valor: 4, rotulo: 'Quinta-feira', curto: 'qui' },
  { valor: 5, rotulo: 'Sexta-feira', curto: 'sex' },
  { valor: 6, rotulo: 'Sábado', curto: 'sáb' },
  { valor: 7, rotulo: 'Domingo', curto: 'dom' },
]

/** "HH:mm[:ss]" -> Date de hoje com essa hora (para o Calendar em modo hora). */
export function horaParaData(hora) {
  if (!hora) return null
  const [h, m] = hora.split(':').map(Number)
  return new Date(2000, 0, 1, h, m)
}

/** Date -> "HH:mm". */
export function dataParaHora(data) {
  if (!data) return null
  return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`
}

export const cortarSegundos = (hora) => String(hora).slice(0, 5)

/** Quando a loja muda de estado, em linguagem natural: "às 22:00", "amanhã às 11:00" ou "sex às 11:00". */
function quando(iso) {
  const alvo = new Date(iso)
  const hoje = new Date()
  const dia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diferenca = Math.round((dia(alvo) - dia(hoje)) / 86400000)
  const hora = `${String(alvo.getHours()).padStart(2, '0')}:${String(alvo.getMinutes()).padStart(2, '0')}`
  if (diferenca <= 0) return `às ${hora}`
  if (diferenca === 1) return `amanhã às ${hora}`
  return `${DIAS_SEMANA[(alvo.getDay() + 6) % 7].curto} às ${hora}`
}

/** Texto de apoio do selo: quando fecha/abre, ou por que está assim. */
export function descreverSituacao(situacao) {
  if (!situacao) return ''
  if (situacao.modo === 'ABERTA') return 'Aberta manualmente. Clique para mudar.'
  if (situacao.modo === 'FECHADA') return 'Fechada manualmente. Clique para mudar.'
  if (situacao.semHorarios) return 'Sem horário cadastrado: a loja é considerada sempre aberta.'
  if (!situacao.proximaMudanca) return situacao.aberta ? 'Aberta.' : 'Fechada.'
  return situacao.aberta ? `Fecha ${quando(situacao.proximaMudanca)}.` : `Abre ${quando(situacao.proximaMudanca)}.`
}

/** O selo e a tela Minha loja se avisam por aqui quando o funcionamento muda. */
const EVENTO = 'funcionamento-alterado'
export const avisarFuncionamentoAlterado = () => window.dispatchEvent(new Event(EVENTO))
export const aoFuncionamentoAlterado = (funcao) => {
  window.addEventListener(EVENTO, funcao)
  return () => window.removeEventListener(EVENTO, funcao)
}
