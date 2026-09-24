import http from './http'

/** Números da Gestão Interna: lojas, mensalidades, usuários internos e vencimentos. */
export const obterDashboardGestao = () => http.get('/admin/gestao/dashboard').then((res) => res.data)
