import http from './http'

const base = (tenant) => `/admin/lojas/${tenant}/site`

/** Personalização do site da loja: { corPrimaria, bannerUrl, sobre, instagram, facebook, whatsapp, mensagemTopo, dominio }. */
export const obterSite = (tenant) => http.get(base(tenant)).then((res) => res.data)

export const salvarSite = (tenant, dados) => http.put(base(tenant), dados).then((res) => res.data)
