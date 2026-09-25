/** Tipos de forma de pagamento (espelham o enum do backend). */
export const TIPOS_FORMA_PAGAMENTO = [
  { valor: 'DINHEIRO', rotulo: 'Dinheiro' },
  { valor: 'PIX', rotulo: 'PIX' },
  { valor: 'CARTAO_CREDITO', rotulo: 'Cartão de crédito' },
  { valor: 'CARTAO_DEBITO', rotulo: 'Cartão de débito' },
  { valor: 'VALE_REFEICAO', rotulo: 'Vale-refeição' },
  { valor: 'OUTRO', rotulo: 'Outro' },
]

export const rotuloTipoPagamento = (valor) => TIPOS_FORMA_PAGAMENTO.find((t) => t.valor === valor)?.rotulo ?? valor
