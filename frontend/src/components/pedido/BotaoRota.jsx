import { useAuth } from '../../context/AuthContext'
import { obterDadosLoja } from '../../api/adminApi'
import { dispatchMsgError, dispatchMsgWarn } from '../../store/dispatchMsg'
import { rotaGoogleMaps } from '../../utils/mapa'

/**
 * Ícone de mapa que abre o Google Maps com a rota da loja até o endereço do cliente (só pedidos de entrega
 * com endereço). A cada clique consulta o endereço ATUAL da loja (Minha loja), para a origem nunca ficar velha.
 * A aba é aberta no clique (antes da consulta) para o navegador não barrar como pop-up.
 * O tooltip vem de data-pr-tooltip (componente Tooltip da tela).
 */
export default function BotaoRota({ pedido, className = 'botao-rota' }) {
  const { loja } = useAuth()

  if (pedido.tipoEntrega !== 'ENTREGA' || (!pedido.enderecoRua && !pedido.enderecoBairro)) return null

  async function abrirRota(evento) {
    evento.stopPropagation()
    const aba = window.open('', '_blank')
    try {
      const dadosLoja = await obterDadosLoja(loja.tenant, { atualizado: true })
      const url = rotaGoogleMaps(dadosLoja, pedido)
      if (!url) throw new Error('sem endereço')
      if (aba) aba.location.href = url
      else window.location.assign(url)
      if (!dadosLoja.enderecoRua && !dadosLoja.enderecoCidade) {
        dispatchMsgWarn('A loja ainda não tem endereço cadastrado: informe em Loja > Minha loja para a rota sair certa.')
      }
    } catch {
      aba?.close()
      dispatchMsgError('Não foi possível abrir a rota agora.')
    }
  }

  return (
    <button type="button" className={className} aria-label="Ver rota no Google Maps"
            data-pr-tooltip="Ver rota no Google Maps" data-pr-position="top"
            onPointerDown={(e) => e.stopPropagation()} onClick={abrirRota}>
      <i className="fa-solid fa-map-location-dot" aria-hidden="true" />
    </button>
  )
}
