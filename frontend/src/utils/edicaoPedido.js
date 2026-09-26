import { obterProdutosParaPedido } from '../api/pedidosApi'
import { dispatchMsgError, dispatchMsgWarn } from '../store/dispatchMsg'

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
    // pagamento dividido; pedidos antigos só têm o texto da forma (mantido como está se o pagamento não for mexido)
    pagamentos: (pedido.pagamentos ?? []).map((pg) => ({
      formaId: pg.formaId, nome: pg.forma, tipo: pg.tipo, valor: Number(pg.valor),
      valorRecebido: pg.valorRecebido != null ? Number(pg.valorRecebido) : null,
    })),
    formaLegada: pedido.pagamentos?.length ? null : (pedido.formaPagamento ?? null),
    descontoTipo: pedido.descontoTipo ?? 'PERCENTUAL',
    descontoValor: pedido.descontoValor != null ? Number(pedido.descontoValor) : null,
    observacoes: pedido.observacoes ?? '',
    itens: pedido.itens.map((item) => ({
      guid: item.produtoGuid, nome: item.nomeProduto, preco: Number(item.precoUnitario), quantidade: item.quantidade,
      observacoes: item.observacoes ?? null,
    })),
  }
}

/**
 * Abre uma janela de NOVO pedido com os dados de um pedido anterior (cliente, entrega e itens). Os itens entram com o
 * preço de hoje; o que saiu do cardápio fica de fora (com aviso). Pagamento, desconto e taxa de entrega recomeçam.
 */
export async function repetirPedido(tenant, pedido, abrirNovo) {
  const atuais = new Map((await obterProdutosParaPedido(tenant)).map((p) => [p.guid, p]))
  const itens = []
  const ausentes = []
  pedido.itens.forEach((item) => {
    const produto = atuais.get(item.produtoGuid)
    if (produto) {
      itens.push({ guid: produto.guid, nome: produto.nome, preco: Number(produto.preco), quantidade: item.quantidade, observacoes: item.observacoes ?? null })
    } else {
      ausentes.push(item.nomeProduto)
    }
  })
  if (itens.length === 0) {
    dispatchMsgError('Nenhum item deste pedido está mais disponível no cardápio.')
    return
  }
  if (ausentes.length > 0) dispatchMsgWarn(`Ficaram de fora (indisponíveis): ${ausentes.join(', ')}.`)
  const base = rascunhoDoPedido(pedido)
  abrirNovo({ ...base, itens, pagamentos: [], formaLegada: null, descontoTipo: 'PERCENTUAL', descontoValor: null, taxaEntrega: null })
}
