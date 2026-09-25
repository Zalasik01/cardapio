import { useEffect, useRef } from 'react'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import http from '../api/http'
import { lerSessao } from '../utils/sessao'

const ESPERA_RECONEXAO_MS = 4000

/**
 * Recebe em tempo real (Server-Sent Events) os avisos de pedido novo e de mudança de situação da loja.
 * aoEvento({ tipo: 'NOVO' | 'STATUS', pedidoId }) roda a cada aviso; aoReconectar() roda quando a conexão volta
 * (para recarregar o que possa ter sido perdido). aoNotificacao(notificacao) roda a cada notificação nova da loja. A conexão usa o token atual a cada tentativa: se ele expirou,
 * uma chamada comum antes de reconectar o renova.
 */
export default function usePedidosAoVivo(tenant, aoEvento, aoReconectar, aoNotificacao) {
  const eventoRef = useRef(aoEvento)
  const reconectarRef = useRef(aoReconectar)
  eventoRef.current = aoEvento
  reconectarRef.current = aoReconectar
  const notificacaoRef = useRef(aoNotificacao)
  notificacaoRef.current = aoNotificacao

  useEffect(() => {
    if (!tenant) return undefined
    const controle = new AbortController()
    let jaConectou = false

    async function conectar() {
      while (!controle.signal.aborted) {
        try {
          await http.get('/admin/permissoes/minhas') // renova o token, se preciso
          await fetchEventSource(`${http.defaults.baseURL}/admin/lojas/${tenant}/pedidos/eventos`, {
            signal: controle.signal,
            openWhenHidden: true,
            headers: { Authorization: `Bearer ${lerSessao().accessToken}` },
            onopen: async (resposta) => {
              if (!resposta.ok) throw new Error(`Falha ao conectar (${resposta.status})`)
              if (jaConectou) reconectarRef.current?.()
              jaConectou = true
            },
            onmessage: (mensagem) => {
              if (mensagem.event === 'pedido') eventoRef.current?.(JSON.parse(mensagem.data))
              if (mensagem.event === 'notificacao') notificacaoRef.current?.(JSON.parse(mensagem.data))
            },
            onerror: (erro) => {
              throw erro // sai do fetchEventSource; o laço abaixo reconecta com token novo
            },
          })
        } catch {
          // segue para a espera e tenta de novo
        }
        await new Promise((resolver) => setTimeout(resolver, ESPERA_RECONEXAO_MS))
      }
    }

    conectar()
    return () => controle.abort()
  }, [tenant])
}
