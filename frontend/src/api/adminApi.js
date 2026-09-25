import http from './http'

export const buscarLoja = (tenant) =>
  http.get(`/admin/lojas/${tenant}`).then((res) => res.data)

export const atualizarLoja = (tenant, dados) =>
  http.put(`/admin/lojas/${tenant}`, dados).then((res) => res.data)
