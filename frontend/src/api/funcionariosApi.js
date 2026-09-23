import http from './http'

const base = (tenant) => `/admin/lojas/${tenant}/funcionarios`

/** Busca paginada. filtros: { busca, nome, cpf, ativo }; page comeca em 0. */
export const buscarFuncionarios = (tenant, { page = 0, size = 10, ...filtros }) => {
  const params = { page, size }
  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor !== '' && valor !== null && valor !== undefined) params[chave] = valor
  })
  return http.get(base(tenant), { params }).then((res) => res.data)
}

export const obterFuncionario = (tenant, id) =>
  http.get(`${base(tenant)}/${id}`).then((res) => res.data)

export const criarFuncionario = (tenant, dados) =>
  http.post(base(tenant), dados).then((res) => res.data)

export const atualizarFuncionario = (tenant, id, dados) =>
  http.put(`${base(tenant)}/${id}`, dados).then((res) => res.data)

export const excluirFuncionario = (tenant, id) => http.delete(`${base(tenant)}/${id}`)
