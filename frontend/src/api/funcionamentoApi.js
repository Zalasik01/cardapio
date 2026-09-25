import http from './http'

const base = (tenant) => `/admin/lojas/${tenant}/funcionamento`

/** Modo, estado atual e horários: { modo, aberta, semHorarios, proximaMudanca, horarios: [{ diaSemana, abre, fecha }] }. */
export const obterFuncionamento = (tenant) => http.get(base(tenant)).then((res) => res.data)

/** Só o estado atual (leve), para o selo "Loja aberta/fechada" do cabeçalho. */
export const obterSituacaoLoja = (tenant) => http.get(`${base(tenant)}/situacao`).then((res) => res.data)

/** Salva o modo e substitui os horários (diaSemana de 1 = segunda a 7 = domingo; horas em "HH:mm"). */
export const salvarFuncionamento = (tenant, dados) => http.put(base(tenant), dados).then((res) => res.data)

/** Abrir/fechar agora ('ABERTA' | 'FECHADA') ou voltar ao horário ('AUTOMATICO'). */
export const alterarModoFuncionamento = (tenant, modo) =>
  http.put(`${base(tenant)}/modo`, { modo }).then((res) => res.data)
