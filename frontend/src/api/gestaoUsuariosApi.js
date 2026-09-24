import http from './http'

const base = '/admin/gestao/usuarios'

/** Busca paginada dos usuários internos. filtros: { busca, administrador, mostrarInativos }; page começa em 0. */
export const buscarUsuariosInternos = ({ page = 0, size = 10, ...filtros }) => {
  const params = { page, size }
  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor !== '' && valor !== null && valor !== undefined) params[chave] = valor
  })
  return http.get(base, { params }).then((res) => res.data)
}

export const obterUsuarioInterno = (id) => http.get(`${base}/${id}`).then((res) => res.data)

/** Devolve { usuario, token, expiraEm }; token é o código do link /novo-usuario/{token}. */
export const criarUsuarioInterno = (dados) => http.post(base, dados).then((res) => res.data)

export const atualizarUsuarioInterno = (id, dados) => http.put(`${base}/${id}`, dados).then((res) => res.data)

export const excluirUsuarioInterno = (id) => http.delete(`${base}/${id}`)

export const gerarNovoLinkUsuarioInterno = (id) => http.post(`${base}/${id}/novo-link`).then((res) => res.data)

export const alterarEmailUsuarioInterno = (id, email) =>
  http.put(`${base}/${id}/email`, { email }).then((res) => res.data)

export const redefinirSenhaUsuarioInterno = (id, senhaTemporaria) =>
  http.put(`${base}/${id}/senha`, { senhaTemporaria }).then((res) => res.data)

export const alterarAtivoUsuarioInterno = (id, ativo) =>
  http.put(`${base}/${id}/ativo`, { ativo }).then((res) => res.data)
