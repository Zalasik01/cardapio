import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { obterDadosLoja } from '../../api/adminApi'
import { rotaGoogleMaps } from '../../utils/mapa'

/**
 * Ícone de mapa que abre o Google Maps com a rota da loja até o endereço do cliente (só pedidos de entrega
 * com endereço). Renderiza um link comum, então abre em nova aba sem ser barrado pelo navegador.
 * A classe "permissoes__botao" não é usada aqui: o tooltip vem de data-pr-tooltip (componente Tooltip da tela).
 */
export default function BotaoRota({ pedido, className = 'botao-rota' }) {
  const { loja } = useAuth()
  const [dadosLoja, setDadosLoja] = useState(null)

  useEffect(() => {
    if (pedido.tipoEntrega !== 'ENTREGA') return
    obterDadosLoja(loja.tenant).then(setDadosLoja).catch(() => setDadosLoja({}))
  }, [pedido.tipoEntrega, loja.tenant])

  if (pedido.tipoEntrega !== 'ENTREGA' || !dadosLoja) return null
  const url = rotaGoogleMaps(dadosLoja, pedido)
  if (!url) return null

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className} aria-label="Ver rota no Google Maps"
       data-pr-tooltip="Ver rota no Google Maps" data-pr-position="top" onPointerDown={(e) => e.stopPropagation()}>
      <i className="fa-solid fa-map-location-dot" aria-hidden="true" />
    </a>
  )
}
