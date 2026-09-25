import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'

const ChatPedidosContext = createContext(null)

const MAXIMO_JANELAS = 5
const chave = (tenant) => `pedidosEmAndamento:${tenant}`

export const RASCUNHO_VAZIO = {
  nomeCliente: '', telefoneCliente: '', tipoEntrega: 'RETIRADA', cep: '', enderecoRua: '', enderecoNumero: '',
  enderecoComplemento: '', enderecoBairro: '', enderecoCidade: '', formasPagamento: [], descontoTipo: 'PERCENTUAL', descontoValor: null, observacoes: '', itens: [],
}

function lerJanelas(tenant) {
  try {
    const salvo = JSON.parse(localStorage.getItem(chave(tenant)) || '[]')
    return Array.isArray(salvo) ? salvo : []
  } catch {
    return []
  }
}

/**
 * Pedidos que a loja está lançando (balcão, telefone...), mantidos como janelas de bate-papo na base da tela.
 * O estado vive no layout do painel, então continua ao trocar de tela, e é guardado no navegador para não se
 * perder ao recarregar. Cada janela é um pedido em andamento: { id, minimizada, rascunho }.
 */
export function ChatPedidosProvider({ children }) {
  const { loja } = useAuth()
  const tenant = loja?.tenant
  const [janelas, setJanelas] = useState(() => (tenant ? lerJanelas(tenant) : []))

  useEffect(() => {
    if (!tenant) return
    try {
      localStorage.setItem(chave(tenant), JSON.stringify(janelas))
    } catch {
      // sem armazenamento: as janelas duram só até recarregar
    }
  }, [tenant, janelas])

  const abrirNovo = useCallback((rascunho = {}) => {
    setJanelas((atual) => {
      if (atual.length >= MAXIMO_JANELAS) return atual
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      // as outras janelas se minimizam para a nova ficar em foco
      return [...atual.map((j) => ({ ...j, minimizada: true })), { id, minimizada: false, rascunho: { ...RASCUNHO_VAZIO, ...rascunho } }]
    })
  }, [])

  const fechar = useCallback((id) => setJanelas((atual) => atual.filter((j) => j.id !== id)), [])

  const alternar = useCallback((id) => {
    setJanelas((atual) => atual.map((j) => (j.id === id ? { ...j, minimizada: !j.minimizada } : j)))
  }, [])

  const atualizar = useCallback((id, alteracoes) => {
    setJanelas((atual) => atual.map((j) => (j.id === id ? { ...j, rascunho: { ...j.rascunho, ...alteracoes } } : j)))
  }, [])

  const valor = useMemo(
    () => ({ janelas, abrirNovo, fechar, alternar, atualizar, limiteAtingido: janelas.length >= MAXIMO_JANELAS }),
    [janelas, abrirNovo, fechar, alternar, atualizar],
  )

  return <ChatPedidosContext.Provider value={valor}>{children}</ChatPedidosContext.Provider>
}

export function useChatPedidos() {
  const contexto = useContext(ChatPedidosContext)
  if (!contexto) throw new Error('useChatPedidos deve ser usado dentro de um ChatPedidosProvider')
  return contexto
}
