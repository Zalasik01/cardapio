import http from './http'

const base = (tenant) => `/admin/lojas/${tenant}/pedidos`

/**
 * Busca paginada de pedidos. inicio e fim (yyyy-MM-dd, no máximo 90 dias) são obrigatórios; filtros opcionais:
 * busca (cliente, telefone ou número), status e tipoEntrega. page começa em 0.
 */
export const buscarPedidos = (tenant, { page = 0, size = 10, ...filtros }) => {
  const params = { page, size }
  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor !== '' && valor !== null && valor !== undefined) params[chave] = valor
  })
  return http.get(base(tenant), { params }).then((res) => res.data)
}

export const obterPedido = (tenant, id) => http.get(`${base(tenant)}/${id}`).then((res) => res.data)

export const atualizarStatusPedido = (tenant, id, status) =>
  http.put(`${base(tenant)}/${id}/status`, { status }).then((res) => res.data)

// vários cartões do dashboard pedem o mesmo período ao mesmo tempo: a mesma consulta é reaproveitada por alguns segundos
const cache = new Map()
const VALIDADE_CACHE_MS = 5000

/** Números do dashboard: { total, entregues, faturamento, emAndamento } dos pedidos criados no período. */
export function obterResumoPedidos(tenant, inicio, fim) {
  const chave = `${tenant}|${inicio}|${fim}`
  const guardado = cache.get(chave)
  if (guardado && Date.now() - guardado.em < VALIDADE_CACHE_MS) return guardado.promessa
  const promessa = http.get(`${base(tenant)}/resumo`, { params: { inicio, fim } }).then((res) => res.data)
  cache.set(chave, { promessa, em: Date.now() })
  promessa.catch(() => cache.delete(chave))
  return promessa
}
