import http from './http'

const base = (tenant) => `/admin/lojas/${tenant}/cupons`

/** Busca paginada dos cupons. filtros: { busca, mostrarInativos }; page começa em 0. */
export const buscarCupons = (tenant, { page = 0, size = 10, ...filtros }) => {
  const params = { page, size }
  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor !== '' && valor !== null && valor !== undefined) params[chave] = valor
  })
  return http.get(base(tenant), { params }).then((res) => res.data)
}

export const obterCupom = (tenant, id) => http.get(`${base(tenant)}/${id}`).then((res) => res.data)

export const criarCupom = (tenant, dados) => http.post(base(tenant), dados).then((res) => res.data)

export const atualizarCupom = (tenant, id, dados) => http.put(`${base(tenant)}/${id}`, dados).then((res) => res.data)

export const alterarAtivoCupom = (tenant, id, ativo) => http.put(`${base(tenant)}/${id}/ativo`, { ativo })

export const excluirCupom = (tenant, id) => http.delete(`${base(tenant)}/${id}`)
