import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { chaveDoItem } from '../utils/opcoes'

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

  /** opcoes: adicionais/variações escolhidos ([{ id, grupo, nome, preco }]); o preço do item já os inclui. */
  function adicionarItem(produto, quantidade = 1, observacoes = '', opcoes = []) {
    const adicional = opcoes.reduce((soma, o) => soma + Number(o.preco), 0)
    const novo = {
      produtoGuid: produto.guid,
      nome: produto.nome,
      imagemUrl: produto.imagemUrl ?? null,
      preco: Number(produto.preco) + adicional,
      quantidade,
      observacoes,
      opcoes,
    }
    setItens((atual) => {
      const existente = atual.find((i) => chaveDoItem(i) === chaveDoItem(novo))
      if (existente) return atual.map((i) => (i === existente ? { ...i, quantidade: i.quantidade + quantidade } : i))
      return [...atual, novo]
    })
  }

  /** item: a linha da sacola (identifica produto + observação + opções). */
  function alterarQuantidade(item, quantidade) {
    const chave = chaveDoItem(item)
    setItens((atual) => (quantidade <= 0
      ? atual.filter((i) => chaveDoItem(i) !== chave)
      : atual.map((i) => (chaveDoItem(i) === chave ? { ...i, quantidade } : i))))
  }

  function removerItem(item) {
    const chave = chaveDoItem(item)
    setItens((atual) => atual.filter((i) => chaveDoItem(i) !== chave))
  }

  function limparCarrinho() {
    setItens([])
    // apaga já do navegador: quem limpa e sai da tela na mesma hora (checkout -> acompanhamento) desmonta o provedor
    // antes de o efeito que grava o estado rodar, e a sacola antiga voltaria na próxima visita
    try {
      localStorage.removeItem(chaveCarrinho(slug))
    } catch {
      // sem armazenamento local: nada a apagar
    }
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
