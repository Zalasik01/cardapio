import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { OverlayPanel } from 'primereact/overlaypanel'
import { useAuth } from '../context/AuthContext'
import { useNotificacoes } from '../context/NotificacoesContext'
import { simularPedidoCliente } from '../api/pedidosApi'
import { dispatchMsgError } from '../store/dispatchMsg'
import { confirmar } from '../utils/confirmar'

/** "há 5 min", "há 2 h" ou a data, a partir do horário da notificação. */
function tempoDesde(iso) {
  const minutos = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutos < 1) return 'agora'
  if (minutos < 60) return `há ${minutos} min`
  if (minutos < 1440) return `há ${Math.floor(minutos / 60)} h`
  return new Date(iso).toLocaleDateString('pt-BR')
}

/**
 * Sino do cabeçalho: número de não lidas, lista das últimas notificações de pedidos (o clique abre o pedido) e
 * os ajustes de aviso (som e notificação do navegador). Some para quem não pode ver pedidos.
 */
export default function SinoNotificacoes() {
  const navigate = useNavigate()
  const { loja, pode } = useAuth()
  const painel = useRef(null)
  const {
    ativo, notificacoes, naoLidas, lidasAte, marcarTodasLidas, limpar, somLigado, alternarSom, navegador, ativarNavegador,
  } = useNotificacoes()

  if (!ativo) return null

  // TEMPORÁRIO (teste): cria um pedido como se fosse de um cliente e gera a notificação
  function simular() {
    simularPedidoCliente(loja.tenant).catch((e) => dispatchMsgError(e.mensagem))
  }

  function pedirLimpeza() {
    confirmar({
      mensagem: 'Limpar todas as notificações? Elas são apagadas para todos os usuários da loja e não podem ser recuperadas.',
      rotuloConfirmar: 'Limpar',
      aoConfirmar: limpar,
    })
  }

  function abrir(notificacao) {
    painel.current.hide()
    marcarTodasLidas()
    if (notificacao.rota) navigate(notificacao.rota)
  }

  return (
    <>
      <button type="button" className="botao-icone sino" aria-label={`Notificações${naoLidas ? `, ${naoLidas} não lidas` : ''}`}
              aria-haspopup="dialog" onClick={(e) => painel.current.toggle(e)}>
        <i className="pi pi-bell" aria-hidden="true" />
        {naoLidas > 0 && <span className="sino__contagem">{naoLidas > 9 ? '9+' : naoLidas}</span>}
      </button>

      <OverlayPanel ref={painel} className="sino__painel" onHide={marcarTodasLidas}>
        <div className="sino__topo">
          <strong>Notificações</strong>
          <span className="sino__acoes">
            <button type="button" className="sino__link" disabled={naoLidas === 0} onClick={marcarTodasLidas}>
              Marcar como lidas
            </button>
            <button type="button" className="sino__link sino__link--perigo" disabled={notificacoes.length === 0} onClick={pedirLimpeza}>
              Limpar
            </button>
          </span>
        </div>

        {notificacoes.length === 0 ? (
          <p className="sino__vazio">Nenhuma notificação por enquanto.</p>
        ) : (
          <ul className="sino__lista">
            {notificacoes.map((n) => (
              <li key={n.id}>
                <button type="button" className={`sino__item${n.id > lidasAte ? ' sino__item--nova' : ''}`} onClick={() => abrir(n)}>
                  <i className={{ PEDIDO_AGUARDANDO: 'fa-solid fa-hourglass-half', PEDIDO_EDITADO: 'fa-solid fa-pen', PEDIDO_ATRASADO: 'fa-solid fa-triangle-exclamation' }[n.tipo] ?? 'fa-solid fa-receipt'} aria-hidden="true" />
                  <span className="sino__texto">
                    <strong>{n.titulo}</strong>
                    {n.mensagem && <small>{n.mensagem}</small>}
                  </span>
                  <small className="sino__tempo">{tempoDesde(n.dataCriacao)}</small>
                </button>
              </li>
            ))}
          </ul>
        )}

        {pode('PEDIDOS_INCLUIR', 'PAINEL_PEDIDOS_INCLUIR') && (
          <div className="sino__rodape sino__teste">
            <button type="button" className="sino__link" onClick={simular}>
              <i className="fa-solid fa-flask" aria-hidden="true" /> Simular pedido de cliente (teste)
            </button>
          </div>
        )}

        <div className="sino__rodape">
          <button type="button" className="sino__link" onClick={alternarSom}>
            <i className={somLigado ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark'} aria-hidden="true" />{' '}
            {somLigado ? 'Som ligado' : 'Som desligado'}
          </button>
          {navegador === 'default' && (
            <button type="button" className="sino__link" onClick={ativarNavegador}>
              <i className="fa-regular fa-bell" aria-hidden="true" /> Ativar avisos do navegador
            </button>
          )}
          {navegador === 'granted' && <small><i className="fa-solid fa-check" aria-hidden="true" /> Avisos do navegador ativos</small>}
          {navegador === 'denied' && <small>Avisos do navegador bloqueados nas configurações do site</small>}
        </div>
      </OverlayPanel>
    </>
  )
}
