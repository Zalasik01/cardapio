import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CarrinhoContext = createContext(null)

function chaveCarrinho(slug) {
  return `cardapio_carrinho_${slug}`
}

export function CarrinhoProvider({ slug, children }) {
  const [itens, setItens] = useState(() => {
    const salvo = localStorage.getItem(chaveCarrinho(slug))
    return salvo ? JSON.parse(salvo) : []
  })

  useEffect(() => {
    localStorage.setItem(chaveCarrinho(slug), JSON.stringify(itens))
  }, [itens, slug])

  function adicionarItem(produto, quantidade = 1, observacoes = '') {
    setItens((atual) => {
      const existente = atual.find((i) => i.produtoGuid === produto.guid && i.observacoes === observacoes)
      if (existente) {
        return atual.map((i) =>
          i === existente ? { ...i, quantidade: i.quantidade + quantidade } : i
        )
      }
      return [
        ...atual,
        {
          produtoGuid: produto.guid,
          nome: produto.nome,
          preco: produto.preco,
          quantidade,
          observacoes,
        },
      ]
    })
  }

  function alterarQuantidade(produtoGuid, observacoes, quantidade) {
    setItens((atual) => {
      if (quantidade <= 0) {
        return atual.filter((i) => !(i.produtoGuid === produtoGuid && i.observacoes === observacoes))
      }
      return atual.map((i) =>
        i.produtoGuid === produtoGuid && i.observacoes === observacoes ? { ...i, quantidade } : i
      )
    })
  }

  function removerItem(produtoGuid, observacoes) {
    setItens((atual) => atual.filter((i) => !(i.produtoGuid === produtoGuid && i.observacoes === observacoes)))
  }

  function limparCarrinho() {
    setItens([])
  }

  const subtotal = useMemo(
    () => itens.reduce((soma, item) => soma + item.preco * item.quantidade, 0),
    [itens]
  )

  const totalItens = useMemo(() => itens.reduce((soma, item) => soma + item.quantidade, 0), [itens])

  return (
    <CarrinhoContext.Provider
      value={{ itens, adicionarItem, alterarQuantidade, removerItem, limparCarrinho, subtotal, totalItens }}
    >
      {children}
    </CarrinhoContext.Provider>
  )
}

export function useCarrinho() {
  const contexto = useContext(CarrinhoContext)
  if (!contexto) {
    throw new Error('useCarrinho deve ser usado dentro de um CarrinhoProvider')
  }
  return contexto
}
