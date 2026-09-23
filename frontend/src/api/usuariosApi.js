import http from './http'

const base = (tenant) => `/admin/lojas/${tenant}/usuarios`

/** Busca paginada. filtros: { busca, nome, email, ativo, status }; page comeca em 0. */
export const buscarUsuarios = (tenant, { page = 0, size = 10, ...filtros }) => {
  const params = { page, size }
  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor !== '' && valor !== null && valor !== undefined) params[chave] = valor
  })
  return http.get(base(tenant), { params }).then((res) => res.data)
}

export const obterUsuario = (tenant, guid) =>
  http.get(`${base(tenant)}/${guid}`).then((res) => res.data)

/** Devolve { usuario, token, expiraEm }; token e o codigo do link /novo-usuario/{token}. */
export const criarUsuario = (tenant, dados) =>
  http.post(base(tenant), dados).then((res) => res.data)

export const atualizarUsuario = (tenant, guid, dados) =>
  http.put(`${base(tenant)}/${guid}`, dados).then((res) => res.data)

export const excluirUsuario = (tenant, guid) => http.delete(`${base(tenant)}/${guid}`)

export const gerarNovoLinkUsuario = (tenant, guid) =>
  http.post(`${base(tenant)}/${guid}/novo-link`).then((res) => res.data)
