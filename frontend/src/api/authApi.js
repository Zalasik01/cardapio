import http from './http'

export const login = (email, senha) =>
  http.post('/auth/login', { email, senha }).then((res) => res.data)

/** Lojas que o usuario logado pode acessar (todas, para o usuario do sistema). */
export const listarLojasAcessiveis = (busca = '') =>
  http.get('/auth/lojas', { params: busca ? { busca } : {} }).then((res) => res.data)

export const selecionarLoja = (lojaGuid) =>
  http.post('/auth/selecionar-loja', { lojaGuid }).then((res) => res.data)
