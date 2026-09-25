import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import { Button } from 'primereact/button'
import { useChatPedidos } from '../../context/ChatPedidosContext'
import { useImpressaoPedido } from '../../context/ImpressaoPedidoContext'
import { useAuth } from '../../context/AuthContext'
import { dispatchMsgError, dispatchMsgSuccess, dispatchMsgWarn } from '../../store/dispatchMsg'
import DialogoCancelarPedido from '../../components/pedido/DialogoCancelarPedido'
import { atualizarStatusPedido, obterQuadroPedidos } from '../../api/pedidosApi'
import usePedidosAoVivo from '../../hooks/usePedidosAoVivo'
import { Skeleton } from '../../components/Skeleton'
import { formatarMoeda } from '../../utils/formatadores'
import { ACAO_STATUS, rotuloTipoEntrega, STATUS_PEDIDO } from '../../utils/pedido'

// cancelado não ganha coluna (o pedido sai do quadro): cancela-se pelo X do cartão
const COLUNAS = ['PENDENTE', 'CONFIRMADO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA', 'ENTREGUE']
const CHAVE_SOM = 'painelPedidosSom'
const ITENS_NO_CARTAO = 3

const lerSom = () => {
  try {
    return localStorage.getItem(CHAVE_SOM) !== 'desligado'
  } catch {
    return true
  }
}

/** "há 5 min" a partir da data de criação. */
function tempoDecorrido(iso, agora) {
  const minutos = Math.max(0, Math.floor((agora - new Date(iso).getTime()) / 60000))
  if (minutos < 1) return 'agora'
  if (minutos < 60) return `há ${minutos} min`
  return `há ${Math.floor(minutos / 60)} h ${minutos % 60} min`
}

/** Aparência do cartão de um pedido (também usada na cópia que acompanha o mouse durante o arraste). */
function CartaoBase({ pedido, agora, novo, atualizando, aoAvancar, aoCancelar, aoImprimir, podeAlterar, podeCancelar, arrastando, refNo, ligacoes }) {
  const proximo = pedido.proximosStatus.find((s) => s !== 'CANCELADO')
  const restantes = pedido.itens.length - ITENS_NO_CARTAO

  return (
    <article ref={refNo} {...ligacoes}
             className={`painel-cartao${novo ? ' painel-cartao--novo' : ''}${arrastando ? ' painel-cartao--arrastando' : ''}`}>
      <header className="painel-cartao__topo">
        <Link to={`/admin/pedidos/${pedido.id}`} className="painel-cartao__numero" onPointerDown={(e) => e.stopPropagation()}>
          Pedido {pedido.id}
        </Link>
        <span className="painel-cartao__tempo">{tempoDecorrido(pedido.dataCriacao, agora)}</span>
      </header>
      <strong className="painel-cartao__cliente">{pedido.nomeCliente}</strong>
      <span className="painel-cartao__linha">
        <i className={pedido.tipoEntrega === 'ENTREGA' ? 'fa-solid fa-motorcycle' : 'fa-solid fa-bag-shopping'} aria-hidden="true" />{' '}
        {[rotuloTipoEntrega(pedido.tipoEntrega), pedido.tipoEntrega === 'ENTREGA' && pedido.enderecoBairro].filter(Boolean).join(' · ')}
      </span>
      <ul className="painel-cartao__itens">
        {pedido.itens.slice(0, ITENS_NO_CARTAO).map((item, i) => (
          <li key={i}>{item.quantidade}x {item.nomeProduto}</li>
        ))}
        {restantes > 0 && <li className="painel-cartao__mais">+ {restantes} {restantes === 1 ? 'item' : 'itens'}</li>}
      </ul>
      <footer className="painel-cartao__rodape">
        <strong>{formatarMoeda(pedido.total)}</strong>
        <span onPointerDown={(e) => e.stopPropagation()} className="painel-cartao__acoes">
          {aoImprimir && (
            <Button type="button" icon="pi pi-print" severity="secondary" text rounded aria-label="Imprimir para a cozinha"
                    data-pr-tooltip="Imprimir para a cozinha" onClick={() => aoImprimir(pedido, 'COZINHA')} />
          )}
          {pedido.proximosStatus.includes('CANCELADO') && podeCancelar && (
            <Button type="button" icon="pi pi-times" severity="danger" text rounded aria-label="Cancelar pedido"
                    disabled={atualizando} onClick={() => aoCancelar(pedido)} />
          )}
          {proximo && podeAlterar && (
            <Button type="button" size="small" label={ACAO_STATUS[proximo].rotulo} icon={ACAO_STATUS[proximo].icone}
                    disabled={atualizando} onClick={() => aoAvancar(pedido, proximo)} />
          )}
        </span>
      </footer>
    </article>
  )
}

/** Cartão arrastável para a coluna da próxima situação (ou avançado pelo botão). */
function CartaoPedido(props) {
  const { pedido, podeAlterar } = props
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: pedido.id, data: { pedido }, disabled: !podeAlterar || pedido.proximosStatus.length === 0,
  })
  return <CartaoBase {...props} refNo={setNodeRef} ligacoes={{ ...attributes, ...listeners }} arrastando={isDragging} />
}

/** Coluna de uma situação: recebe os cartões arrastados para ela. */
function Coluna({ status, pedidos, alvoValido, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const info = STATUS_PEDIDO[status]
  return (
    <section ref={setNodeRef}
             className={`painel-coluna painel-coluna--${info.tom}${alvoValido ? ' painel-coluna--alvo' : ''}${isOver && alvoValido ? ' painel-coluna--sobre' : ''}`}
             aria-label={info.rotulo}>
      <h2 className="painel-coluna__titulo">
        {info.rotulo} <span className="painel-coluna__total">{pedidos.length}</span>
      </h2>
      <div className="painel-coluna__cartoes">
        {children}
        {pedidos.length === 0 && <span className="painel-coluna__vazio">Nenhum pedido</span>}
      </div>
    </section>
  )
}

function PainelSkeleton() {
  return (
    <div className="painel-quadro" aria-busy="true" aria-label="Carregando pedidos">
      {COLUNAS.map((status, i) => (
        <div key={status} className="painel-coluna">
          <Skeleton largura="60%" altura="1rem" />
          {Array.from({ length: i % 2 === 0 ? 2 : 1 }, (_, j) => (
            <div key={j} className="painel-cartao painel-cartao--esqueleto">
              <Skeleton largura="50%" altura="0.8rem" />
              <Skeleton largura="80%" altura="1rem" />
              <Skeleton largura="65%" altura="0.8rem" />
              <Skeleton largura="90%" altura="0.8rem" />
              <Skeleton altura="1.8rem" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Operação > Painel de pedidos: quadro (kanban) por situação. Atualiza sozinho quando chega pedido ou algum muda
 * de situação (eventos em tempo real), com aviso sonoro de pedido novo. Arraste o cartão para a próxima coluna
 * ou use o botão do cartão.
 */
export default function PaginaPainelPedidos() {
  const { loja, pode } = useAuth()
  const { abrirNovo, limiteAtingido } = useChatPedidos()
  const { imprimir } = useImpressaoPedido()
  const tenant = loja.tenant
  const [pedidos, setPedidos] = useState(null)
  const [atualizando, setAtualizando] = useState(null)
  const [arrastando, setArrastando] = useState(null)
  const [cancelando, setCancelando] = useState(null) // pedido em cancelamento (diálogo aberto)
  const [novos, setNovos] = useState(() => new Set())
  const [somLigado, setSomLigado] = useState(lerSom)
  const [agora, setAgora] = useState(() => Date.now())
  const audio = useRef(null)
  const somRef = useRef(somLigado)
  somRef.current = somLigado

  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const podeAlterar = pode('PAINEL_PEDIDOS_ALTERAR_STATUS')
  const podeCancelar = pode('PAINEL_PEDIDOS_CANCELAR')

  const carregar = useCallback(() => {
    obterQuadroPedidos(tenant).then(setPedidos).catch((e) => dispatchMsgError(e.mensagem))
  }, [tenant])

  useEffect(() => {
    carregar()
  }, [carregar])

  useEffect(() => {
    audio.current = new Audio('/sons/novo-pedido.wav')
    const relogio = setInterval(() => setAgora(Date.now()), 30000)
    return () => clearInterval(relogio)
  }, [])

  function tocarSom() {
    if (!somRef.current || !audio.current) return
    audio.current.currentTime = 0
    // o navegador só libera som depois de uma interação na página: sem ela, o aviso visual basta
    audio.current.play().catch(() => {})
  }

  usePedidosAoVivo(tenant, (evento) => {
    carregar()
    if (evento.tipo === 'NOVO') {
      tocarSom()
      setNovos((atual) => new Set(atual).add(evento.pedidoId))
      setTimeout(() => setNovos((atual) => {
        const restante = new Set(atual)
        restante.delete(evento.pedidoId)
        return restante
      }), 15000)
    }
  }, carregar)

  function alternarSom() {
    const proximo = !somLigado
    setSomLigado(proximo)
    try {
      localStorage.setItem(CHAVE_SOM, proximo ? 'ligado' : 'desligado')
    } catch {
      // sem armazenamento: vale só nesta sessão
    }
    if (proximo && audio.current) audio.current.play().catch(() => {}) // serve de teste e libera o som no navegador
  }

  async function mudarStatus(pedido, status, extra) {
    setAtualizando(pedido.id)
    try {
      const atualizado = await atualizarStatusPedido(tenant, pedido.id, status, extra)
      setPedidos((lista) => lista.map((p) => (p.id === atualizado.id ? atualizado : p)))
      dispatchMsgSuccess(`Pedido ${pedido.id}: ${STATUS_PEDIDO[status].rotulo.toLowerCase()}`)
    } catch (e) {
      dispatchMsgError(e.mensagem)
      carregar()
    } finally {
      setAtualizando(null)
    }
  }

  function cancelar(pedido) {
    setCancelando(pedido) // abre o diálogo com o motivo e a taxa de cancelamento
  }

  async function confirmarCancelamento(dados) {
    await mudarStatus(cancelando, 'CANCELADO', dados)
    setCancelando(null)
  }

  function aoSoltar({ active, over }) {
    setArrastando(null)
    const pedido = active.data.current?.pedido
    if (!pedido || !over || over.id === pedido.status) return
    if (!pedido.proximosStatus.includes(over.id)) {
      dispatchMsgWarn(`O pedido ${pedido.id} não pode ir de "${STATUS_PEDIDO[pedido.status].rotulo}" para "${STATUS_PEDIDO[over.id].rotulo}".`)
      return
    }
    mudarStatus(pedido, over.id)
  }

  const porStatus = useMemo(() => {
    const grupos = Object.fromEntries(COLUNAS.map((s) => [s, []]))
    ;(pedidos ?? []).forEach((p) => grupos[p.status]?.push(p))
    return grupos
  }, [pedidos])

  const propsCartao = { agora, atualizando: atualizando !== null, aoAvancar: mudarStatus, aoCancelar: cancelar, aoImprimir: imprimir, podeAlterar, podeCancelar }

  return (
    <div className="pagina-admin painel-pagina">
      <div className="painel-pagina__topo">
        <div className="painel-pagina__texto">
          <h1>Painel de pedidos</h1>
          <p className="texto-auxiliar">
            Atualiza sozinho. Arraste o pedido para a próxima situação ou use o botão do cartão. Mostra os pedidos em andamento e os encerrados hoje.
          </p>
        </div>
        <div className="painel-pagina__acoes">
        {pode('PAINEL_PEDIDOS_INCLUIR') && (
          <Button type="button" size="small" icon="pi pi-plus" label="Novo pedido" disabled={limiteAtingido}
                  onClick={() => abrirNovo()} />
        )}
        <Button type="button" outlined severity="secondary" size="small" aria-pressed={somLigado}
                icon={somLigado ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark'}
                label={somLigado ? 'Som ligado' : 'Som desligado'} onClick={alternarSom} />
        </div>
      </div>

      <DialogoCancelarPedido pedido={cancelando} enviando={atualizando !== null} aoFechar={() => setCancelando(null)}
                             aoConfirmar={confirmarCancelamento} />

      {pedidos === null ? <PainelSkeleton /> : (
        <DndContext sensors={sensores} onDragStart={({ active }) => setArrastando(active.data.current.pedido)}
                    onDragEnd={aoSoltar} onDragCancel={() => setArrastando(null)}>
          <div className="painel-quadro">
            {COLUNAS.map((status) => (
              <Coluna key={status} status={status} pedidos={porStatus[status]}
                      alvoValido={!!arrastando && arrastando.proximosStatus.includes(status)}>
                {porStatus[status].map((pedido) => (
                  <CartaoPedido key={pedido.id} pedido={pedido} novo={novos.has(pedido.id)} {...propsCartao} />
                ))}
              </Coluna>
            ))}
          </div>
          <DragOverlay>
            {arrastando && <CartaoBase pedido={arrastando} novo={false} {...propsCartao} />}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
