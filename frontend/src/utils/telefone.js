/** Máscara de telefone brasileiro enquanto digita: (47) 99999-8888 ou (47) 9999-8888. */
export function mascaraTelefone(valor) {
  const d = String(valor ?? '').replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  const corte = d.length === 11 ? 7 : 6
  return `(${d.slice(0, 2)}) ${d.slice(2, corte)}-${d.slice(corte)}`
}

/** Máscara de CEP enquanto digita: 89070-572. */
export function mascaraCep(valor) {
  const d = String(valor ?? '').replace(/\D/g, '').slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}
