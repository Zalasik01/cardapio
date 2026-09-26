import http from './http'

const base = (tenant) => `/admin/lojas/${tenant}/fidelidade`

/** Configuração do cashback da loja: { programaAtivo, percentual, validadeDias, resgateMinimo, resgateMaximoPct }. */
export const obterFidelidade = (tenant) => http.get(base(tenant)).then((res) => res.data)

export const salvarFidelidade = (tenant, dados) => http.put(base(tenant), dados).then((res) => res.data)

// ---- cliente do cardápio online

/** Carteira do cliente na loja: saldo, próximo vencimento, regras e extrato. */
export const obterCarteiraCliente = (slug) =>
  http.get('/publico/cliente/fidelidade', { params: { slug } }).then((res) => res.data)

/** Quanto do saldo pode ser usado num pedido cujos itens (já com cupom) valem "base". */
export const obterCashbackResgatavel = (slug, base) =>
  http.get('/publico/cliente/fidelidade/resgatavel', { params: { slug, base } }).then((res) => res.data.valor)
