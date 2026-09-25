/** Constantes dos pedidos (espelham os enums do backend). tom é o selo usado nas listas. */

export const STATUS_PEDIDO = {
  PENDENTE: { rotulo: 'Pendente', tom: 'alerta' },
  CONFIRMADO: { rotulo: 'Confirmado', tom: 'alerta' },
  EM_PREPARO: { rotulo: 'Em preparo', tom: 'alerta' },
  SAIU_PARA_ENTREGA: { rotulo: 'Saiu para entrega', tom: 'alerta' },
  ENTREGUE: { rotulo: 'Entregue', tom: 'sucesso' },
  CANCELADO: { rotulo: 'Cancelado', tom: 'erro' },
}

export const OPCOES_STATUS = Object.entries(STATUS_PEDIDO).map(([valor, { rotulo }]) => ({ valor, rotulo }))

export const TIPOS_ENTREGA = [
  { valor: 'ENTREGA', rotulo: 'Entrega' },
  { valor: 'RETIRADA', rotulo: 'Retirada' },
]

export const rotuloTipoEntrega = (valor) => TIPOS_ENTREGA.find((t) => t.valor === valor)?.rotulo ?? valor

/** Texto do botão que leva o pedido para cada status. */
export const ACAO_STATUS = {
  CONFIRMADO: { rotulo: 'Confirmar pedido', icone: 'pi pi-check' },
  EM_PREPARO: { rotulo: 'Iniciar preparo', icone: 'pi pi-clock' },
  SAIU_PARA_ENTREGA: { rotulo: 'Saiu para entrega', icone: 'pi pi-send' },
  ENTREGUE: { rotulo: 'Marcar como entregue', icone: 'pi pi-check-circle' },
  CANCELADO: { rotulo: 'Cancelar pedido', icone: 'pi pi-times' },
}

/** Ícone do botão de avanço conforme a categoria da situação de destino. */
export const ICONE_CATEGORIA = {
  PENDENTE: 'pi pi-inbox',
  CONFIRMADO: 'pi pi-check',
  EM_PREPARO: 'pi pi-clock',
  SAIU_PARA_ENTREGA: 'pi pi-send',
  ENTREGUE: 'pi pi-check-circle',
  CANCELADO: 'pi pi-times',
}

/** Nome amigável de cada categoria (o que a situação significa para o sistema). */
export const CATEGORIAS_SITUACAO = [
  { valor: 'PENDENTE', rotulo: 'Novo (aguardando)' },
  { valor: 'CONFIRMADO', rotulo: 'Confirmado' },
  { valor: 'EM_PREPARO', rotulo: 'Em preparo' },
  { valor: 'SAIU_PARA_ENTREGA', rotulo: 'Em entrega' },
  { valor: 'ENTREGUE', rotulo: 'Concluído' },
  { valor: 'CANCELADO', rotulo: 'Cancelado' },
]
