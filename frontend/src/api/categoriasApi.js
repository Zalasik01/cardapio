import http from './http'

const base = (tenant) => `/admin/lojas/${tenant}/categorias`

/** Busca paginada das categorias do cardápio. filtros: { busca, mostrarInativos }; page começa em 0. */
export const buscarCategorias = (tenant, { page = 0, size = 10, ...filtros }) => {
  const params = { page, size }
  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor !== '' && valor !== null && valor !== undefined) params[chave] = valor
  })
  return http.get(base(tenant), { params }).then((res) => res.data)
}

export const obterCategoria = (tenant, id) => http.get(`${base(tenant)}/${id}`).then((res) => res.data)

export const criarCategoria = (tenant, dados) => http.post(base(tenant), dados).then((res) => res.data)

export const atualizarCategoria = (tenant, id, dados) => http.put(`${base(tenant)}/${id}`, dados).then((res) => res.data)

export const alterarAtivoCategoria = (tenant, id, ativo) => http.put(`${base(tenant)}/${id}/ativo`, { ativo })

export const excluirCategoria = (tenant, id) => http.delete(`${base(tenant)}/${id}`)
