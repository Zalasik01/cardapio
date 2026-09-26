import http from './http'

const base = (tenant) => `/admin/lojas/${tenant}/avaliacoes`

/** Avaliações paginadas. nota: 1 a 5 (opcional); semResposta: só as que a loja ainda não respondeu. */
export const buscarAvaliacoes = (tenant, { nota, semResposta = false, page = 0, size = 10 }) => {
  const params = { semResposta, page, size }
  if (nota) params.nota = nota
  return http.get(base(tenant), { params }).then((res) => res.data)
}

/** { total, mediaLoja, mediaEntrega } da loja. */
export const obterResumoAvaliacoes = (tenant) => http.get(`${base(tenant)}/resumo`).then((res) => res.data)

export const responderAvaliacao = (tenant, id, resposta) => http.put(`${base(tenant)}/${id}/resposta`, { resposta })

/** O cliente avalia o pedido entregue (o guid do pedido é o segredo do link). */
export const avaliarPedido = (guid, { notaLoja, notaEntrega, comentario }) =>
  http.post(`/publico/acompanhamento/${guid}/avaliacao`, { notaLoja, notaEntrega, comentario }).then((res) => res.data)
