import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { limparNotificacoes, listarNotificacoes } from '../api/notificacoesApi'
import { obterPreferencia, salvarPreferencia } from '../api/preferenciasApi'
import usePedidosAoVivo from '../hooks/usePedidosAoVivo'
import { dispatchMsgError, dispatchMsgSuccess, dispatchMsgWarn } from '../store/dispatchMsg'

const NotificacoesContext = createContext(null)

const CHAVE_SOM = 'notificacoesSom'
const PERMISSOES_PEDIDOS = ['PEDIDOS_LEITURA', 'PAINEL_PEDIDOS_LEITURA']

const lerSom = () => {
  try {
    return localStorage.getItem(CHAVE_SOM) !== 'desligado'
  } catch {
    return true
  }
}

const estadoNavegador = () => (typeof Notification === 'undefined' ? 'indisponivel' : Notification.permission)

/**
 * Notificações da loja sobre pedidos. Uma única conexão em tempo real (SSE) alimenta:
 *  - o sino do cabeçalho (histórico e não lidas; o "lido até" é por usuário, guardado nas preferências dele);
 *  - o aviso na tela, o som e a notificação do navegador quando chega algo novo;
 *  - as telas que querem reagir a pedidos (o painel), por assinarEventos(funcao).
 * Só fica ativo para quem pode ver pedidos.
 */
export function NotificacoesProvider({ children }) {
  const { loja, pode } = useAuth()
  const tenant = loja?.tenant
  const ativo = !!tenant && pode(...PERMISSOES_PEDIDOS)
  const chaveLidas = `notificacoes-lidas-${tenant}`

  const [notificacoes, setNotificacoes] = useState([])
  const [lidasAte, setLidasAte] = useState(0)
  const [somLigado, setSomLigado] = useState(lerSom)
  const [navegador, setNavegador] = useState(estadoNavegador)
  const audio = useRef(null)
  const somRef = useRef(somLigado)
  somRef.current = somLigado
  const navegadorRef = useRef(navegador)
  navegadorRef.current = navegador
  const assinantes = useRef(new Set())

  // o navegador só deixa pedir a permissão depois de uma ação do usuário: pede no primeiro clique dentro do painel
  useEffect(() => {
    if (!ativo || estadoNavegador() !== 'default') return undefined
    const pedir = () => {
      Notification.requestPermission().then(setNavegador).catch(() => {})
    }
    document.addEventListener('click', pedir, { once: true })
    return () => document.removeEventListener('click', pedir)
  }, [ativo])

  useEffect(() => {
    audio.current = new Audio('/sons/novo-pedido.wav')
  }, [])

  const carregar = useCallback(() => {
    if (!ativo) return
    listarNotificacoes(tenant).then(setNotificacoes).catch(() => {})
  }, [ativo, tenant])

  useEffect(() => {
    setNotificacoes([])
    setLidasAte(0)
    if (!ativo) return
    carregar()
    obterPreferencia(chaveLidas).then((valor) => setLidasAte(valor?.ate ?? 0)).catch(() => {})
  }, [ativo, carregar, chaveLidas])

  const tocarSom = useCallback(() => {
    if (!somRef.current || !audio.current) return
    audio.current.currentTime = 0
    // o navegador só libera som depois de uma interação na página: sem ela, fica o aviso visual
    audio.current.play().catch(() => {})
  }, [])

  const aoChegarNotificacao = useCallback((notificacao) => {
    setNotificacoes((atual) => (atual.some((n) => n.id === notificacao.id) ? atual : [notificacao, ...atual].slice(0, 30)))
    // a notificação do navegador tem prioridade; o aviso na própria tela só aparece quando ela não está ativada
    if (navegadorRef.current !== 'granted') {
      const texto = [notificacao.titulo, notificacao.mensagem].filter(Boolean).join(' - ')
      if (notificacao.tipo === 'PEDIDO_AGUARDANDO') dispatchMsgWarn(texto)
      else dispatchMsgSuccess(texto)
    }
    tocarSom()
    if (navegadorRef.current === 'granted') {
      const aviso = new Notification(notificacao.titulo, {
        body: notificacao.mensagem || '', icon: '/favicon.svg', tag: `notificacao-${notificacao.id}`,
      })
      aviso.onclick = () => {
        window.focus()
        if (notificacao.rota) window.location.assign(notificacao.rota)
        aviso.close()
      }
    }
  }, [tocarSom])

  usePedidosAoVivo(ativo ? tenant : null, (evento) => assinantes.current.forEach((f) => f(evento)), () => {
    carregar()
    assinantes.current.forEach((f) => f({ tipo: 'RECONECTOU' }))
  }, aoChegarNotificacao)

  /** Registra uma função que recebe cada evento de pedido ({ tipo, pedidoId }); devolve o cancelamento. */
  const assinarEventos = useCallback((funcao) => {
    assinantes.current.add(funcao)
    return () => assinantes.current.delete(funcao)
  }, [])

  const marcarTodasLidas = useCallback(() => {
    const maior = notificacoes.reduce((m, n) => Math.max(m, n.id), lidasAte)
    if (maior === lidasAte) return
    setLidasAte(maior)
    salvarPreferencia(chaveLidas, { ate: maior }).catch(() => {})
  }, [notificacoes, lidasAte, chaveLidas])

  /** Apaga as notificações da loja, inclusive do banco. */
  const limpar = useCallback(async () => {
    try {
      await limparNotificacoes(tenant)
      setNotificacoes([])
    } catch (e) {
      dispatchMsgError(e.mensagem)
    }
  }, [tenant])

  const alternarSom = useCallback(() => {
    const proximo = !somRef.current
    setSomLigado(proximo)
    try {
      localStorage.setItem(CHAVE_SOM, proximo ? 'ligado' : 'desligado')
    } catch {
      // sem armazenamento: vale só nesta sessão
    }
    if (proximo && audio.current) audio.current.play().catch(() => {}) // serve de teste e libera o som no navegador
  }, [])

  /** Pede ao navegador a permissão para mostrar notificações do sistema (mesmo com a aba em segundo plano). */
  const ativarNavegador = useCallback(async () => {
    if (typeof Notification === 'undefined') return
    setNavegador(await Notification.requestPermission())
  }, [])

  const naoLidas = useMemo(() => notificacoes.filter((n) => n.id > lidasAte).length, [notificacoes, lidasAte])

  const valor = useMemo(() => ({
    ativo, notificacoes, naoLidas, lidasAte, marcarTodasLidas, limpar, somLigado, alternarSom, navegador, ativarNavegador, assinarEventos,
  }), [ativo, notificacoes, naoLidas, lidasAte, marcarTodasLidas, limpar, somLigado, alternarSom, navegador, ativarNavegador, assinarEventos])

  return <NotificacoesContext.Provider value={valor}>{children}</NotificacoesContext.Provider>
}

export function useNotificacoes() {
  const contexto = useContext(NotificacoesContext)
  if (!contexto) throw new Error('useNotificacoes deve ser usado dentro de um NotificacoesProvider')
  return contexto
}
