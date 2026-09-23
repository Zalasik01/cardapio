import http from './http'

export const login = (email, senha) =>
  http.post('/auth/login', { email, senha }).then((res) => res.data)

/** Lojas que o usuario logado pode acessar (todas, para o usuario do sistema). */
export const listarLojasAcessiveis = (busca = '') =>
  http.get('/auth/lojas', { params: busca ? { busca } : {} }).then((res) => res.data)

export const selecionarLoja = (lojaGuid) =>
  http.post('/auth/selecionar-loja', { lojaGuid }).then((res) => res.data)

/** Dados do link de novo usuario (nome e e-mail); 404 se o link for invalido ou expirado. */
export const consultarConvite = (token) =>
  http.get(`/auth/novo-usuario/${token}`).then((res) => res.data)

/** Define a senha do novo usuario e devolve a sessao (mesmo formato do login). */
export const definirSenhaNovoUsuario = (token, senha) =>
  http.post(`/auth/novo-usuario/${token}`, { senha }).then((res) => res.data)
