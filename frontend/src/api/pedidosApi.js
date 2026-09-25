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

/** Pedidos do painel (kanban): em andamento e encerrados hoje, com itens e próximos passos. */
export const obterQuadroPedidos = (tenant) => http.get(`${base(tenant)}/quadro`).then((res) => res.data)

/** Produtos que a loja pode lançar num pedido: [{ guid, nome, preco, categoria }]. */
export const obterProdutosParaPedido = (tenant) => http.get(`${base(tenant)}/produtos`).then((res) => res.data)

/** Cria um pedido lançado pela loja (mesmo formato do pedido do cardápio, sem o tenant). */
export const criarPedido = (tenant, dados) => http.post(base(tenant), { ...dados, tenant }).then((res) => res.data)

/** Formas de pagamento ativas da loja (para o lançamento de pedidos). */
export const obterFormasPagamentoParaPedido = (tenant) => http.get(`${base(tenant)}/formas-pagamento`).then((res) => res.data)

/** Clientes cadastrados que combinam com o texto, com telefone e endereço. */
export const buscarClientesParaPedido = (tenant, busca) =>
  http.get(`${base(tenant)}/clientes`, { params: { busca } }).then((res) => res.data)

/** Exclusão lógica do pedido. */
export const excluirPedido = (tenant, id) => http.delete(`${base(tenant)}/${id}`)

/** extra: no cancelamento, { motivo, taxaCancelamento }. */
/** TEMPORÁRIO: cria um pedido como se fosse de um cliente, para testar as notificações. */
export const simularPedidoCliente = (tenant) => http.post(`${base(tenant)}/simular-cliente`).then((res) => res.data)

/** Edita o pedido (mesmo formato do lançamento, sem o tenant). Devolve o pedido com o histórico de alterações. */
export const editarPedido = (tenant, id, dados) => http.put(`${base(tenant)}/${id}`, dados).then((res) => res.data)

export const atualizarStatusPedido = (tenant, id, status, extra = {}) =>
  http.put(`${base(tenant)}/${id}/status`, { status, ...extra }).then((res) => res.data)

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
