import http from './http'

/** Conta do cliente final (cardápio online): entrar por telefone com código (OTP) e ver os pedidos dele. */
export const solicitarCodigoCliente = (telefone) =>
  http.post('/publico/cliente/otp', { telefone }).then((res) => res.data)

export const verificarCodigoCliente = ({ telefone, codigo, nome, slug }) =>
  http.post('/publico/cliente/otp/verificar', { telefone, codigo, nome, slug }).then((res) => res.data)

export const atualizarNomeCliente = (nome) => http.put('/publico/cliente/eu', { nome }).then((res) => res.data)

export const listarPedidosCliente = (slug) =>
  http.get('/publico/cliente/pedidos', { params: { slug } }).then((res) => res.data)

/** Números do cliente na loja: pedidos feitos, total gasto, ticket médio, cliente desde e o produto favorito. */
export const obterResumoCliente = (slug) =>
  http.get('/publico/cliente/resumo', { params: { slug } }).then((res) => res.data)
