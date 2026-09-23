import http from './http'

export const buscarRestaurante = (restauranteId) =>
  http.get(`/admin/restaurantes/${restauranteId}`).then((res) => res.data)

export const listarCategorias = (restauranteId) =>
  http.get(`/admin/restaurantes/${restauranteId}/categorias`).then((res) => res.data)

export const criarCategoria = (restauranteId, dados) =>
  http.post(`/admin/restaurantes/${restauranteId}/categorias`, dados).then((res) => res.data)

export const atualizarCategoria = (restauranteId, categoriaId, dados) =>
  http.put(`/admin/restaurantes/${restauranteId}/categorias/${categoriaId}`, dados).then((res) => res.data)

export const excluirCategoria = (restauranteId, categoriaId) =>
  http.delete(`/admin/restaurantes/${restauranteId}/categorias/${categoriaId}`)

export const listarProdutos = (restauranteId) =>
  http.get(`/admin/restaurantes/${restauranteId}/produtos`).then((res) => res.data)

export const criarProduto = (restauranteId, dados) =>
  http.post(`/admin/restaurantes/${restauranteId}/produtos`, dados).then((res) => res.data)

export const atualizarProduto = (restauranteId, produtoId, dados) =>
  http.put(`/admin/restaurantes/${restauranteId}/produtos/${produtoId}`, dados).then((res) => res.data)

export const excluirProduto = (restauranteId, produtoId) =>
  http.delete(`/admin/restaurantes/${restauranteId}/produtos/${produtoId}`)

export const listarZonasEntrega = (restauranteId) =>
  http.get(`/admin/restaurantes/${restauranteId}/zonas-entrega`).then((res) => res.data)

export const criarZonaEntrega = (restauranteId, dados) =>
  http.post(`/admin/restaurantes/${restauranteId}/zonas-entrega`, dados).then((res) => res.data)

export const atualizarZonaEntrega = (restauranteId, zonaId, dados) =>
  http.put(`/admin/restaurantes/${restauranteId}/zonas-entrega/${zonaId}`, dados).then((res) => res.data)

export const excluirZonaEntrega = (restauranteId, zonaId) =>
  http.delete(`/admin/restaurantes/${restauranteId}/zonas-entrega/${zonaId}`)

export const listarPedidosDoRestaurante = (restauranteId) =>
  http.get(`/admin/restaurantes/${restauranteId}/pedidos`).then((res) => res.data)

export const atualizarStatusPedido = (pedidoId, status) =>
  http.patch(`/pedidos/${pedidoId}/status`, { status }).then((res) => res.data)

export const atualizarRestaurante = (restauranteId, dados) =>
  http.put(`/admin/restaurantes/${restauranteId}`, dados).then((res) => res.data)
