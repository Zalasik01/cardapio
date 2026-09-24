import http from './http'

/** Números da Gestão Interna: lojas, mensalidades, usuários internos e vencimentos. */
export const obterDashboardGestao = () => http.get('/admin/gestao/dashboard').then((res) => res.data)

/** Mensalidades pagas no período (inicio e fim em yyyy-MM-dd; no máximo 90 dias). */
export const obterRecebimentos = (inicio, fim) =>
  http.get('/admin/gestao/dashboard/recebimentos', { params: { inicio, fim } }).then((res) => res.data)
