import http from './http'

export const buscarCardapio = (slug) =>
  http.get(`/publico/restaurantes/${slug}/cardapio`).then((res) => res.data)

export const calcularFrete = ({ restauranteId, bairro, latitude, longitude }) =>
  http
    .post('/publico/frete/calcular', { restauranteId, bairro, latitude, longitude })
    .then((res) => res.data)

export const criarPedido = (pedido) => http.post('/pedidos', pedido).then((res) => res.data)

export const buscarPedido = (id) => http.get(`/pedidos/${id}`).then((res) => res.data)
