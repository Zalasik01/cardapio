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

export const obterUsuario = (tenant, id) =>
  http.get(`${base(tenant)}/${id}`).then((res) => res.data)

/** Devolve { usuario, token, expiraEm }; token e o codigo do link /novo-usuario/{token}. */
export const criarUsuario = (tenant, dados) =>
  http.post(base(tenant), dados).then((res) => res.data)

export const atualizarUsuario = (tenant, id, dados) =>
  http.put(`${base(tenant)}/${id}`, dados).then((res) => res.data)

export const excluirUsuario = (tenant, id) => http.delete(`${base(tenant)}/${id}`)

export const gerarNovoLinkUsuario = (tenant, id) =>
  http.post(`${base(tenant)}/${id}/novo-link`).then((res) => res.data)

/** Foto do usuario como Blob (404 se nao tiver). */
export const obterFotoUsuario = (tenant, id) =>
  http.get(`${base(tenant)}/${id}/foto`, { responseType: 'blob' }).then((res) => res.data)

export const enviarFotoUsuario = (tenant, id, arquivo) => {
  const dados = new FormData()
  dados.append('arquivo', arquivo)
  return http.put(`${base(tenant)}/${id}/foto`, dados)
}

export const removerFotoUsuario = (tenant, id) => http.delete(`${base(tenant)}/${id}/foto`)

/** Altera o e-mail de login (unico caminho para isso). Devolve o usuario atualizado. */
export const alterarEmailUsuario = (tenant, id, email) =>
  http.put(`${base(tenant)}/${id}/email`, { email }).then((res) => res.data)
