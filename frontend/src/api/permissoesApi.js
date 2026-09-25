import http from './http'

/** Catálogo em árvore: categorias do menu > telas > permissões de cada tela. */
export const obterCatalogoPermissoes = () => http.get('/admin/permissoes/catalogo').then((res) => res.data)

/** Permissões de quem está logado: { total, codigos }. */
export const obterMinhasPermissoes = () => http.get('/admin/permissoes/minhas').then((res) => res.data)

/** Permissões de um usuário da loja: { administrador, codigos }. */
export const obterPermissoesUsuario = (tenant, usuarioId) =>
  http.get(`/admin/lojas/${tenant}/usuarios/${usuarioId}/permissoes`).then((res) => res.data)

export const salvarPermissoesUsuario = (tenant, usuarioId, codigos) =>
  http.put(`/admin/lojas/${tenant}/usuarios/${usuarioId}/permissoes`, { codigos }).then((res) => res.data)

/** Copia as permissões do usuário de origem para o de destino (substitui as do destino). */
export const copiarPermissoesUsuario = (tenant, destinoId, origemId) =>
  http.post(`/admin/lojas/${tenant}/usuarios/${destinoId}/permissoes/copiar`, { origemId }).then((res) => res.data)
