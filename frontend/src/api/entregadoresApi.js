import http from './http'

const base = (tenant) => `/admin/lojas/${tenant}`

/** Busca paginada de entregadores. filtros: { busca, mostrarInativos }; page começa em 0. */
export const buscarEntregadores = (tenant, { page = 0, size = 10, ...filtros }) => {
  const params = { page, size }
  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor !== '' && valor !== null && valor !== undefined) params[chave] = valor
  })
  return http.get(`${base(tenant)}/entregadores`, { params }).then((res) => res.data)
}

/** Entregadores ativos (sem o link secreto), para escolher quem entrega um pedido. */
export const listarEntregadoresAtivos = (tenant) => http.get(`${base(tenant)}/entregadores/ativos`).then((res) => res.data)

export const obterEntregador = (tenant, id) => http.get(`${base(tenant)}/entregadores/${id}`).then((res) => res.data)

export const criarEntregador = (tenant, dados) => http.post(`${base(tenant)}/entregadores`, dados).then((res) => res.data)

export const atualizarEntregador = (tenant, id, dados) =>
  http.put(`${base(tenant)}/entregadores/${id}`, dados).then((res) => res.data)

export const alterarAtivoEntregador = (tenant, id, ativo) => http.put(`${base(tenant)}/entregadores/${id}/ativo`, { ativo })

export const gerarNovoLinkEntregador = (tenant, id) => http.post(`${base(tenant)}/entregadores/${id}/novo-link`).then((res) => res.data)

export const excluirEntregador = (tenant, id) => http.delete(`${base(tenant)}/entregadores/${id}`)

/** Pedidos de entrega em andamento por entregador: { entregadores: [...], semEntregador: [...] }. */
export const obterEntregasEmRota = (tenant) => http.get(`${base(tenant)}/entregas/em-rota`).then((res) => res.data)

/** Entregas concluídas e repasse por entregador no período (no máximo 90 dias). */
export const obterRepasse = (tenant, inicio, fim) =>
  http.get(`${base(tenant)}/entregas/repasse`, { params: { inicio, fim } }).then((res) => res.data)

/** Atribui o entregador de um pedido (entregadorId nulo tira o entregador). */
export const atribuirEntregador = (tenant, pedidoId, entregadorId) =>
  http.put(`${base(tenant)}/pedidos/${pedidoId}/entregador`, { entregadorId }).then((res) => res.data)

// ---- páginas públicas (sem login): o link secreto é o acesso

/** Painel do entregador (celular): { nome, loja, entregas: [...] }. */
export const obterPainelEntregador = (token) => http.get(`/publico/entregador/${token}`).then((res) => res.data)

export const entregadorSaiu = (token, pedidoId) => http.post(`/publico/entregador/${token}/pedidos/${pedidoId}/saiu`)

/** Conclui a entrega; foto é um File opcional (comprovante) e codigo é o de 4 dígitos que o cliente recebeu (prova de entrega). */
export const entregadorEntregou = (token, pedidoId, foto, codigo) => {
  const dados = new FormData()
  if (foto) dados.append('foto', foto)
  if (codigo) dados.append('codigo', codigo)
  return http.post(`/publico/entregador/${token}/pedidos/${pedidoId}/entregue`, dados)
}

export const enviarPosicaoEntregador = (token, latitude, longitude) =>
  http.post(`/publico/entregador/${token}/posicao`, { latitude, longitude })

/** Acompanhamento do pedido pelo cliente (o guid do pedido é o segredo do link). */
export const obterAcompanhamento = (guid) => http.get(`/publico/acompanhamento/${guid}`).then((res) => res.data)
