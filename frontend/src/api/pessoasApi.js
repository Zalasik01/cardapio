import http from './http'

const base = (tenant) => `/admin/lojas/${tenant}/pessoas`

/** Busca paginada de clientes e fornecedores. filtros: { busca, nome, documento, tipo, papel, mostrarInativos }; page começa em 0. */
export const buscarPessoas = (tenant, { page = 0, size = 10, ...filtros }) => {
  const params = { page, size }
  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor !== '' && valor !== null && valor !== undefined) params[chave] = valor
  })
  return http.get(base(tenant), { params }).then((res) => res.data)
}

export const obterPessoa = (tenant, id) =>
  http.get(`${base(tenant)}/${id}`).then((res) => res.data)

export const criarPessoa = (tenant, dados) =>
  http.post(base(tenant), dados).then((res) => res.data)

export const atualizarPessoa = (tenant, id, dados) =>
  http.put(`${base(tenant)}/${id}`, dados).then((res) => res.data)

export const excluirPessoa = (tenant, id) => http.delete(`${base(tenant)}/${id}`)
