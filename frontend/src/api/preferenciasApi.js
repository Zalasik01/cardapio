import http from './http'

/**
 * Preferências de tela do usuário logado (guardadas no servidor, só dele: outro usuário do mesmo
 * navegador ou de outro computador tem as suas). O valor é um objeto JSON definido por cada tela.
 */
export const obterPreferencia = (chave) =>
  http.get(`/perfil/preferencias/${chave}`).then((res) => (res.data.valor ? JSON.parse(res.data.valor) : null))

export const salvarPreferencia = (chave, valor) =>
  http.put(`/perfil/preferencias/${chave}`, { valor: JSON.stringify(valor) })
