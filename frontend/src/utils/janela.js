/** Dias da semana (1 = segunda ... 7 = domingo), como o servidor guarda: "1,2,3". */
export const DIAS_SEMANA = [
  { valor: 1, rotulo: 'Segunda' }, { valor: 2, rotulo: 'Terça' }, { valor: 3, rotulo: 'Quarta' }, { valor: 4, rotulo: 'Quinta' },
  { valor: 5, rotulo: 'Sexta' }, { valor: 6, rotulo: 'Sábado' }, { valor: 7, rotulo: 'Domingo' },
]

/** "1,2,5" -> [1, 2, 5] (vazio -> []). */
export const diasParaLista = (csv) => (csv ? csv.split(',').map(Number).filter((n) => n >= 1 && n <= 7) : [])

/** [1, 2, 5] -> "1,2,5" (vazio -> null, que o servidor lê como "todos os dias"). */
export const diasParaCsv = (lista) => (lista?.length ? [...lista].sort((a, b) => a - b).join(',') : null)

/** "17:30:00" -> Date de hoje às 17:30 (para o seletor de hora); vazio -> null. */
export function horaParaData(texto) {
  if (!texto) return null
  const [h, m] = texto.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

/** Date -> "17:30" (o servidor aceita HH:mm); vazio -> null. */
export const dataParaHora = (data) => (data ? `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}` : null)
