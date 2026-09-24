import http from './http'

const base = '/admin/gestao/lojas'

/** Busca paginada das lojas da plataforma. filtros: { busca, situacaoConta, tipoOrganizacao, mostrarInativos }; page começa em 0. */
export const buscarLojasGestao = ({ page = 0, size = 10, ...filtros }) => {
  const params = { page, size }
  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor !== '' && valor !== null && valor !== undefined) params[chave] = valor
  })
  return http.get(base, { params }).then((res) => res.data)
}

export const obterLojaGestao = (id) => http.get(`${base}/${id}`).then((res) => res.data)

export const criarLojaGestao = (dados) => http.post(base, dados).then((res) => res.data)

export const atualizarLojaGestao = (id, dados) => http.put(`${base}/${id}`, dados).then((res) => res.data)

export const excluirLojaGestao = (id) => http.delete(`${base}/${id}`)

/** Mensalidades da loja (mais recentes primeiro). */
export const listarMensalidades = (lojaId) => http.get(`${base}/${lojaId}/mensalidades`).then((res) => res.data)

export const criarMensalidade = (lojaId, dados) =>
  http.post(`${base}/${lojaId}/mensalidades`, dados).then((res) => res.data)

export const atualizarMensalidade = (lojaId, id, dados) =>
  http.put(`${base}/${lojaId}/mensalidades/${id}`, dados).then((res) => res.data)

export const excluirMensalidade = (lojaId, id) => http.delete(`${base}/${lojaId}/mensalidades/${id}`)

/** Anotações da equipe sobre a loja (mais recentes primeiro). */
export const listarAnotacoes = (lojaId) => http.get(`${base}/${lojaId}/anotacoes`).then((res) => res.data)

export const criarAnotacao = (lojaId, texto) =>
  http.post(`${base}/${lojaId}/anotacoes`, { texto }).then((res) => res.data)

export const atualizarAnotacao = (lojaId, id, texto) =>
  http.put(`${base}/${lojaId}/anotacoes/${id}`, { texto }).then((res) => res.data)

export const excluirAnotacao = (lojaId, id) => http.delete(`${base}/${lojaId}/anotacoes/${id}`)
