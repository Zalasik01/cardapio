import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { useAuth } from './AuthContext'
import ComprovantePedido from '../components/pedido/ComprovantePedido'
import { buscarLoja } from '../api/adminApi'
import { obterPedido } from '../api/pedidosApi'
import { dispatchMsgError } from '../store/dispatchMsg'

const ImpressaoPedidoContext = createContext(null)

/**
 * Impressão de comprovantes de pedido (via da cozinha ou do entregador) em impressora térmica de 80 mm ou
 * comum, pelo diálogo de impressão do navegador (react-to-print). O comprovante fica escondido na página e só
 * vai para o papel.
 */
export function ImpressaoPedidoProvider({ children }) {
  const { loja } = useAuth()
  const conteudo = useRef(null)
  const [alvo, setAlvo] = useState(null) // { pedido, via, dadosLoja }
  const dadosLoja = useRef(null) // dados da loja (endereço, telefone), buscados uma vez

  const imprimirConteudo = useReactToPrint({
    contentRef: conteudo,
    documentTitle: alvo ? `Pedido ${alvo.pedido.id}` : 'Pedido',
    onAfterPrint: () => setAlvo(null),
  })

  // com o comprovante já desenhado, abre o diálogo de impressão
  useEffect(() => {
    if (alvo) imprimirConteudo()
  }, [alvo, imprimirConteudo])

  /** pedido pode ser o objeto completo (com itens) ou só { id }; nesse caso ele é buscado antes. */
  const imprimir = useCallback(async (pedido, via) => {
    try {
      const completo = pedido.itens ? pedido : await obterPedido(loja.tenant, pedido.id)
      if (!dadosLoja.current) dadosLoja.current = await buscarLoja(loja.tenant)
      setAlvo({ pedido: completo, via })
    } catch (e) {
      dispatchMsgError(e.mensagem)
    }
  }, [loja.tenant])

  return (
    <ImpressaoPedidoContext.Provider value={{ imprimir }}>
      {children}
      <div className="comprovante-escondido" aria-hidden="true">
        <div ref={conteudo}>
          {alvo && <ComprovantePedido pedido={alvo.pedido} via={alvo.via} loja={dadosLoja.current ?? loja} />}
        </div>
      </div>
    </ImpressaoPedidoContext.Provider>
  )
}

export function useImpressaoPedido() {
  const contexto = useContext(ImpressaoPedidoContext)
  if (!contexto) throw new Error('useImpressaoPedido deve ser usado dentro de um ImpressaoPedidoProvider')
  return contexto
}
