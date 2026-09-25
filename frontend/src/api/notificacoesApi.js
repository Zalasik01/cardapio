import http from './http'

/** Últimas notificações da loja (mais nova primeiro): [{ id, tipo, titulo, mensagem, rota, pedidoId, dataCriacao }]. */
export const listarNotificacoes = (tenant) => http.get(`/admin/lojas/${tenant}/notificacoes`).then((res) => res.data)
