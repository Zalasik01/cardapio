export const TIPOS_CUPOM = [
  { valor: 'PERCENTUAL', rotulo: 'Percentual (%)' },
  { valor: 'VALOR', rotulo: 'Valor fixo (R$)' },
  { valor: 'FRETE_GRATIS', rotulo: 'Frete grátis' },
]

export const rotuloTipoCupom = (valor) => TIPOS_CUPOM.find((t) => t.valor === valor)?.rotulo ?? valor

/** Date -> "2026-09-26T18:30:00" (hora local, sem fuso: o servidor guarda a hora da loja); vazio -> null. */
export function dataParaApi(data) {
  if (!data) return null
  const p = (n) => String(n).padStart(2, '0')
  return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}T${p(data.getHours())}:${p(data.getMinutes())}:00`
}

/** "2026-09-26T18:30:00" -> Date local; vazio -> null. */
export const dataDaApi = (texto) => (texto ? new Date(texto) : null)
