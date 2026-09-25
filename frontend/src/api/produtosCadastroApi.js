import http from './http'

const base = (tenant) => `/admin/lojas/${tenant}/cadastro-produtos`

/**
 * Busca paginada de produtos de um tipo. filtros: { tipo ('FINAL' | 'INGREDIENTE'), busca, categoriaId,
 * mostrarInativos }; page começa em 0.
 */
export const buscarProdutosCadastro = (tenant, { page = 0, size = 10, ...filtros }) => {
  const params = { page, size }
  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor !== '' && valor !== null && valor !== undefined) params[chave] = valor
  })
  return http.get(base(tenant), { params }).then((res) => res.data)
}

/** Categorias do cardápio: [{ id, nome }]. */
export const listarCategoriasCadastro = (tenant) => http.get(`${base(tenant)}/categorias`).then((res) => res.data)

export const obterProdutoCadastro = (tenant, id) => http.get(`${base(tenant)}/${id}`).then((res) => res.data)

export const criarProdutoCadastro = (tenant, dados) => http.post(base(tenant), dados).then((res) => res.data)

export const atualizarProdutoCadastro = (tenant, id, dados) =>
  http.put(`${base(tenant)}/${id}`, dados).then((res) => res.data)

export const excluirProdutoCadastro = (tenant, id) => http.delete(`${base(tenant)}/${id}`)

/** Próximo código incremental da loja (sugerido no cadastro de produto novo). */
export const obterProximoCodigo = (tenant) => http.get(`${base(tenant)}/proximo-codigo`).then((res) => res.data.codigo)

/** Ativa ou inativa o produto. */
export const alterarAtivoProdutoCadastro = (tenant, id, ativo) => http.put(`${base(tenant)}/${id}/ativo`, { ativo })
