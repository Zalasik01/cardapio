import http from './http'

const base = (tenant) => `/admin/lojas/${tenant}/formas-pagamento`

/** Busca paginada das formas de pagamento. filtros: { busca, mostrarInativos }; page começa em 0. */
export const buscarFormasPagamento = (tenant, { page = 0, size = 10, ...filtros }) => {
  const params = { page, size }
  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor !== '' && valor !== null && valor !== undefined) params[chave] = valor
  })
  return http.get(base(tenant), { params }).then((res) => res.data)
}

export const obterFormaPagamento = (tenant, id) => http.get(`${base(tenant)}/${id}`).then((res) => res.data)

export const criarFormaPagamento = (tenant, dados) => http.post(base(tenant), dados).then((res) => res.data)

export const atualizarFormaPagamento = (tenant, id, dados) =>
  http.put(`${base(tenant)}/${id}`, dados).then((res) => res.data)

export const alterarAtivoFormaPagamento = (tenant, id, ativo) => http.put(`${base(tenant)}/${id}/ativo`, { ativo })

export const excluirFormaPagamento = (tenant, id) => http.delete(`${base(tenant)}/${id}`)
