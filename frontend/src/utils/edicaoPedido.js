/** Texto do selo "Editado": as mudanças da edição mais recente, uma por linha (usado no tooltip). */
export function resumoUltimaEdicao(pedido) {
  const ultima = pedido.alteracoes?.[0]
  if (!ultima) return 'Pedido editado'
  return ['Última edição:', ...ultima.descricoes].join('\n')
}

/** Rascunho do formulário de pedido (janela do dock) a partir de um pedido existente. */
export function rascunhoDoPedido(pedido) {
  const entrega = pedido.tipoEntrega === 'ENTREGA'
  return {
    nomeCliente: pedido.nomeCliente ?? '',
    telefoneCliente: pedido.telefoneCliente ?? '',
    tipoEntrega: pedido.tipoEntrega,
    cep: '',
    enderecoRua: pedido.enderecoRua ?? '',
    enderecoNumero: pedido.enderecoNumero ?? '',
    enderecoComplemento: pedido.enderecoComplemento ?? '',
    enderecoBairro: pedido.enderecoBairro ?? '',
    enderecoCidade: pedido.enderecoCidade ?? '',
    taxaEntrega: entrega ? Number(pedido.taxaEntrega) : null,
    formasPagamento: pedido.formaPagamento ? pedido.formaPagamento.split(', ').filter(Boolean) : [],
    descontoTipo: pedido.descontoTipo ?? 'PERCENTUAL',
    descontoValor: pedido.descontoValor != null ? Number(pedido.descontoValor) : null,
    observacoes: pedido.observacoes ?? '',
    itens: pedido.itens.map((item) => ({
      guid: item.produtoGuid, nome: item.nomeProduto, preco: Number(item.precoUnitario), quantidade: item.quantidade,
      observacoes: item.observacoes ?? null,
    })),
  }
}
