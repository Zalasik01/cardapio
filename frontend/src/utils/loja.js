/** Constantes das lojas da plataforma (espelham os enums do backend). */

export const TIPOS_ORGANIZACAO = [
  { valor: 'RESTAURANTE', rotulo: 'Restaurante' },
  { valor: 'LANCHONETE', rotulo: 'Lanchonete' },
  { valor: 'PIZZARIA', rotulo: 'Pizzaria' },
  { valor: 'CAFETERIA', rotulo: 'Cafeteria' },
  { valor: 'CONFEITARIA', rotulo: 'Confeitaria' },
  { valor: 'OUTRO', rotulo: 'Outro' },
]

export const SITUACOES_CONTA = [
  { valor: 'TRIAL', rotulo: 'Período de teste' },
  { valor: 'ATIVA', rotulo: 'Ativa' },
  { valor: 'INADIMPLENTE', rotulo: 'Inadimplente' },
  { valor: 'BLOQUEADA', rotulo: 'Bloqueada' },
  { valor: 'CANCELADA', rotulo: 'Cancelada' },
]

const rotulo = (lista, valor) => lista.find((item) => item.valor === valor)?.rotulo ?? valor
export const rotuloTipoOrganizacao = (valor) => rotulo(TIPOS_ORGANIZACAO, valor)
export const rotuloSituacaoConta = (valor) => rotulo(SITUACOES_CONTA, valor)

/** Cor do selo (mesmos tons da tela de busca) de cada situação da conta. */
const TOM_SITUACAO = { ATIVA: 'sucesso', TRIAL: 'alerta', INADIMPLENTE: 'alerta', BLOQUEADA: 'erro', CANCELADA: 'erro' }
export const tomSituacaoConta = (valor) => TOM_SITUACAO[valor] ?? 'alerta'
