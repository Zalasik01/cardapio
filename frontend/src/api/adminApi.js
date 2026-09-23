import http from './http'

export const buscarLoja = (tenant) =>
  http.get(`/admin/lojas/${tenant}`).then((res) => res.data)

export const atualizarLoja = (tenant, dados) =>
  http.put(`/admin/lojas/${tenant}`, dados).then((res) => res.data)

export const listarCategorias = (tenant) =>
  http.get(`/admin/lojas/${tenant}/categorias`).then((res) => res.data)

export const criarCategoria = (tenant, dados) =>
  http.post(`/admin/lojas/${tenant}/categorias`, dados).then((res) => res.data)

export const atualizarCategoria = (tenant, categoriaGuid, dados) =>
  http.put(`/admin/lojas/${tenant}/categorias/${categoriaGuid}`, dados).then((res) => res.data)

export const excluirCategoria = (tenant, categoriaGuid) =>
  http.delete(`/admin/lojas/${tenant}/categorias/${categoriaGuid}`)

export const listarProdutos = (tenant) =>
  http.get(`/admin/lojas/${tenant}/produtos`).then((res) => res.data)

export const criarProduto = (tenant, dados) =>
  http.post(`/admin/lojas/${tenant}/produtos`, dados).then((res) => res.data)

export const atualizarProduto = (tenant, produtoGuid, dados) =>
  http.put(`/admin/lojas/${tenant}/produtos/${produtoGuid}`, dados).then((res) => res.data)

export const excluirProduto = (tenant, produtoGuid) =>
  http.delete(`/admin/lojas/${tenant}/produtos/${produtoGuid}`)

export const listarZonasEntrega = (tenant) =>
  http.get(`/admin/lojas/${tenant}/zonas-entrega`).then((res) => res.data)

export const criarZonaEntrega = (tenant, dados) =>
  http.post(`/admin/lojas/${tenant}/zonas-entrega`, dados).then((res) => res.data)

export const atualizarZonaEntrega = (tenant, zonaGuid, dados) =>
  http.put(`/admin/lojas/${tenant}/zonas-entrega/${zonaGuid}`, dados).then((res) => res.data)

export const excluirZonaEntrega = (tenant, zonaGuid) =>
  http.delete(`/admin/lojas/${tenant}/zonas-entrega/${zonaGuid}`)

export const listarPedidosDaLoja = (tenant) =>
  http.get(`/admin/lojas/${tenant}/pedidos`).then((res) => res.data)

export const atualizarStatusPedido = (pedidoGuid, status) =>
  http.patch(`/pedidos/${pedidoGuid}/status`, { status }).then((res) => res.data)
