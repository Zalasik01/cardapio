import http from './http'

export const login = (email, senha) =>
  http.post('/auth/login', { email, senha }).then((res) => res.data)

export const registrarCliente = (dados) =>
  http.post('/auth/registro', dados).then((res) => res.data)
