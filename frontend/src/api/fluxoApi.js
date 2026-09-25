import http from './http'

const base = (tenant) => `/admin/lojas/${tenant}/fluxo-pedidos`

/** Fluxo de pedidos da loja: { situacoes: [{ id, nome, cor, categoria, ordem, ativa, fixa, pedidosAbertos }], transicoes: [{ de, para, tipoPedido, rotulo }] }. */
export const obterFluxo = (tenant) => http.get(base(tenant)).then((res) => res.data)

export const salvarFluxo = (tenant, dados) => http.put(base(tenant), dados).then((res) => res.data)

export const restaurarFluxoPadrao = (tenant) => http.post(`${base(tenant)}/restaurar-padrao`).then((res) => res.data)
