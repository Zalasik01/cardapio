import http from './http'

export const buscarCardapio = (slug) =>
  http.get(`/publico/lojas/${slug}/cardapio`).then((res) => res.data)

export const calcularFrete = ({ tenant, bairro, latitude, longitude }) =>
  http
    .post('/publico/frete/calcular', { tenant, bairro, latitude, longitude })
    .then((res) => res.data)

export const criarPedido = (pedido) => http.post('/pedidos', pedido).then((res) => res.data)

export const buscarPedido = (guid) => http.get(`/pedidos/${guid}`).then((res) => res.data)
