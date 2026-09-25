import http from './http'

export const buscarLoja = (tenant) =>
  http.get(`/admin/lojas/${tenant}`).then((res) => res.data)

export const atualizarLoja = (tenant, dados) =>
  http.put(`/admin/lojas/${tenant}`, dados).then((res) => res.data)

// os dados da loja (endereço, coordenadas, telefone) mudam raramente: uma consulta por loja basta para as telas de pedido
const lojas = new Map()

/** Dados da loja em cache (para rota no mapa e comprovante). */
export function obterDadosLoja(tenant) {
  if (!lojas.has(tenant)) {
    const promessa = buscarLoja(tenant)
    promessa.catch(() => lojas.delete(tenant))
    lojas.set(tenant, promessa)
  }
  return lojas.get(tenant)
}
