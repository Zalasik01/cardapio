import http from './http'

const base = (tenant) => `/admin/lojas/${tenant}/grupos-opcao`

/** Busca paginada dos grupos de opções (adicionais e variações). */
export const buscarGruposOpcao = (tenant, { page = 0, size = 10, ...filtros }) => {
  const params = { page, size }
  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor !== '' && valor !== null && valor !== undefined) params[chave] = valor
  })
  return http.get(base(tenant), { params }).then((res) => res.data)
}

/** Todos os grupos ativos (o cadastro de produto escolhe entre eles). */
export const listarGruposOpcaoAtivos = (tenant) => http.get(`${base(tenant)}/ativos`).then((res) => res.data)

export const obterGrupoOpcao = (tenant, id) => http.get(`${base(tenant)}/${id}`).then((res) => res.data)
export const criarGrupoOpcao = (tenant, dados) => http.post(base(tenant), dados).then((res) => res.data)
export const atualizarGrupoOpcao = (tenant, id, dados) => http.put(`${base(tenant)}/${id}`, dados).then((res) => res.data)
export const alterarAtivoGrupoOpcao = (tenant, id, ativo) => http.put(`${base(tenant)}/${id}/ativo`, { ativo })
export const excluirGrupoOpcao = (tenant, id) => http.delete(`${base(tenant)}/${id}`)
