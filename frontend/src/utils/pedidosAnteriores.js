/** Histórico de pedidos do cliente neste aparelho (para o bloco "Peça novamente"); fica só no navegador dele. */
const chave = (slug) => `cardapio_pedidos_anteriores_${slug}`
const LIMITE_PEDIDOS = 5

export function lerPedidosAnteriores(slug) {
  try {
    return JSON.parse(localStorage.getItem(chave(slug))) ?? []
  } catch {
    return []
  }
}

/** Guarda os itens do pedido feito (mais recente primeiro). */
export function guardarPedidoAnterior(slug, itens) {
  try {
    const guardados = [{ em: Date.now(), produtos: itens.map((i) => i.produtoGuid) }, ...lerPedidosAnteriores(slug)]
    localStorage.setItem(chave(slug), JSON.stringify(guardados.slice(0, LIMITE_PEDIDOS)))
  } catch {
    // sem armazenamento local: o bloco simplesmente não aparece
  }
}
