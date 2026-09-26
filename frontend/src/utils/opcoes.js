/** Regras dos adicionais e variações no cliente (o servidor confere tudo de novo ao gravar o pedido). */

/** Opções escolhidas ([{ id, grupo, nome, preco }]) a partir dos ids marcados. */
export function opcoesEscolhidas(grupos, ids) {
  const marcados = new Set(ids)
  return (grupos ?? []).flatMap((g) => g.opcoes.filter((o) => marcados.has(o.id)).map((o) => ({ id: o.id, grupo: g.nome, nome: o.nome, preco: Number(o.preco) })))
}

export const somaOpcoes = (grupos, ids) => opcoesEscolhidas(grupos, ids).reduce((soma, o) => soma + o.preco, 0)

/** Primeira regra não cumprida ("Escolha uma opção em Tamanho"), ou null quando está tudo certo. */
export function erroDasOpcoes(grupos, ids) {
  const marcados = new Set(ids)
  for (const g of grupos ?? []) {
    const qtd = g.opcoes.filter((o) => marcados.has(o.id)).length
    if (qtd < g.minimo) return `Escolha ${g.minimo === 1 ? 'uma opção' : `pelo menos ${g.minimo} opções`} em "${g.nome}"`
  }
  return null
}

/** Chave que separa, na sacola, o mesmo produto com observações ou opções diferentes. */
export const chaveDoItem = (item) => `${item.produtoGuid}|${item.observacoes ?? ''}|${(item.opcoes ?? []).map((o) => o.id).sort((a, b) => a - b).join(',')}`

/** "Bacon, Queijo extra" para mostrar o item em uma linha. */
export const resumoOpcoes = (opcoes) => (opcoes ?? []).map((o) => o.nome).join(', ')
