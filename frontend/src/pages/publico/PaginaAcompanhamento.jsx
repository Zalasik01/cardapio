import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { obterAcompanhamento } from '../../api/entregadoresApi'
import MapaAcompanhamento from '../../components/MapaAcompanhamento'
import { formatarMoeda } from '../../utils/formatadores'
import { ativarPush, pushAtivo, pushSuportado } from '../../utils/push'

// A conexão em tempo real (SSE) nem sempre chega ao celular (túneis e proxies seguram a resposta), então a consulta
// periódica é a rede de segurança: rápida enquanto o pedido está em andamento, lenta depois que termina.
const POLLING_ATIVO_MS = 5000
const POLLING_FINAL_MS = 60000

const hora = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

/** "há 2 min" da última posição do entregador. */
function haQuanto(iso) {
  const minutos = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  return minutos < 1 ? 'agora' : minutos < 60 ? `há ${minutos} min` : `há ${Math.floor(minutos / 60)} h`
}

/** Ícone e frase de cada momento do pedido (pela categoria da situação, que não muda mesmo se a loja renomear). */
const MOMENTOS = {
  PENDENTE: { icone: 'fa-hourglass-half', frase: 'Aguardando a loja confirmar seu pedido' },
  CONFIRMADO: { icone: 'fa-thumbs-up', frase: 'A loja confirmou! Já vai começar a preparar' },
  EM_PREPARO: { icone: 'fa-fire-burner', frase: 'Estão preparando seu pedido com carinho' },
  SAIU_PARA_ENTREGA: { icone: 'fa-motorcycle', frase: 'Seu pedido saiu e está a caminho' },
  ENTREGUE: { icone: 'fa-circle-check', frase: 'Pedido entregue. Bom apetite!' },
  CANCELADO: { icone: 'fa-circle-xmark', frase: 'Este pedido foi cancelado' },
}

/**
 * Animação de "em andamento" de cada momento do pedido, uma diferente por situação:
 * aguardando (pontinhos), confirmado (selo pulsando), preparo (barra de tempo com brilho), a caminho (moto na estrada),
 * entregue (confete) e cancelado (sem animação).
 */
function AnimacaoMomento({ pedido }) {
  switch (pedido.categoria) {
    case 'PENDENTE':
      return (
        <div className="pedido-anim pedido-anim--pendente" aria-hidden="true">
          <span /><span /><span />
        </div>
      )
    case 'CONFIRMADO':
      return (
        <div className="pedido-anim pedido-anim--confirmado" aria-hidden="true">
          <span className="pedido-anim__onda" /><span className="pedido-anim__onda" /><i className="fa-solid fa-check" />
        </div>
      )
    case 'EM_PREPARO': {
      const inicio = new Date(pedido.criadoEm).getTime()
      const fim = pedido.previsaoPreparo ? new Date(pedido.previsaoPreparo).getTime() : null
      const pct = fim && fim > inicio ? Math.min(96, Math.max(6, ((Date.now() - inicio) / (fim - inicio)) * 100)) : null
      return (
        <div className="pedido-anim pedido-anim--preparo" aria-hidden="true">
          <div className={`pedido-anim__barra${pct === null ? ' pedido-anim__barra--indeterminada' : ''}`}>
            <span style={pct === null ? undefined : { width: `${pct}%` }} />
          </div>
          <span className="pedido-anim__vapor"><i /><i /><i /></span>
        </div>
      )
    }
    case 'SAIU_PARA_ENTREGA':
      return (
        <div className="pedido-anim pedido-anim--rota" aria-hidden="true">
          <div className="pedido-anim__estrada" />
          <i className="fa-solid fa-motorcycle pedido-anim__moto" />
          <i className="fa-solid fa-house pedido-anim__casa" />
        </div>
      )
    case 'ENTREGUE':
      return (
        <div className="pedido-anim pedido-anim--entregue" aria-hidden="true">
          {Array.from({ length: 14 }, (_, i) => <span key={i} style={{ '--i': i, '--j': i % 4 }} />)}
        </div>
      )
    default:
      return null
  }
}

/** Mapa com o trajeto do entregador, a rota até a casa e a posição dele (a estimativa sobe para o cartão de status). */
function MapaEntregador({ pedido, aoEstimar }) {
  const { entregador } = pedido
  return (
    <>
      <MapaAcompanhamento
        entregador={entregador}
        destino={pedido.destinoLatitude != null ? { latitude: pedido.destinoLatitude, longitude: pedido.destinoLongitude } : null}
        destinoTexto={pedido.destino}
        trilha={pedido.trilha}
        aoEstimar={aoEstimar}
      />
      <small className="pedido-mapa__posicao">Posição atualizada {haQuanto(entregador.posicaoEm)}</small>
    </>
  )
}

/** Linha do tempo vertical: etapas feitas com ✓, a atual pulsando e as próximas apagadas. */
function LinhaDoTempo({ etapas }) {
  return (
    <ol className="pedido-etapas" aria-label="Etapas do pedido">
      {etapas.map((etapa) => (
        <li key={etapa.nome} className={etapa.atual ? 'atual' : etapa.concluida ? 'feita' : ''} aria-current={etapa.atual ? 'step' : undefined}>
          <span className="pedido-etapas__marca" aria-hidden="true">
            {etapa.concluida && <i className="fa-solid fa-check" />}
          </span>
          <span>{etapa.nome}</span>
        </li>
      ))}
    </ol>
  )
}

/**
 * Acompanhamento do pedido pelo cliente: /pedido/:guid (sem login; o código do pedido é o segredo do link). Mostra a
 * situação, a linha do tempo, a previsão e, quando o entregador está a caminho, a posição dele. Atualiza em tempo real.
 */
export default function PaginaAcompanhamento() {
  const { guid } = useParams()
  const [pedido, setPedido] = useState(null)
  const [erro, setErro] = useState(null)
  const [estimativa, setEstimativa] = useState(null)
  const encerradoRef = useRef(false)
  const [avisos, setAvisos] = useState(null) // null = verificando; true/false = ligado/desligado

  // service worker do cardápio (recebe os avisos mesmo com a página fechada) e estado dos avisos neste aparelho
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw-loja.js', { scope: '/' }).catch(() => {})
    if (!pushSuportado()) {
      setAvisos(false)
      return
    }
    pushAtivo().then(setAvisos).catch(() => setAvisos(false))
  }, [])

  async function ligarAvisos() {
    try {
      setAvisos(await ativarPush(`/publico/acompanhamento/${guid}/push`))
    } catch {
      setAvisos(false)
    }
  }

  const carregar = useCallback(() => {
    obterAcompanhamento(guid).then((dados) => { setPedido(dados); setErro(null) })
      .catch((e) => setErro(/n[ãa]o encontrad/i.test(e.mensagem ?? '') ? 'Pedido não encontrado. Confira o link.' : 'Não foi possível carregar o pedido agora.'))
  }, [guid])

  useEffect(() => {
    carregar()
    let intervalo
    const agendar = () => {
      clearInterval(intervalo)
      intervalo = setInterval(carregar, encerradoRef.current ? POLLING_FINAL_MS : POLLING_ATIVO_MS)
    }
    agendar()
    // ao voltar para a aba/app (o celular congela os temporizadores em segundo plano), atualiza na hora
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') carregar()
    }
    document.addEventListener('visibilitychange', aoVoltar)
    window.addEventListener('online', carregar)
    const reagendar = setInterval(agendar, 15000)
    let fonte
    try {
      fonte = new EventSource(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/publico/acompanhamento/${guid}/eventos`)
      fonte.addEventListener('atualizado', carregar)
    } catch {
      // sem EventSource: fica só a atualização periódica
    }
    return () => {
      clearInterval(intervalo)
      fonte?.close()
      clearInterval(reagendar)
      document.removeEventListener('visibilitychange', aoVoltar)
      window.removeEventListener('online', carregar)
    }
  }, [guid, carregar])

  useEffect(() => {
    encerradoRef.current = !!pedido && (pedido.concluido || pedido.cancelado)
  }, [pedido])

  useEffect(() => {
    if (pedido) document.title = `Pedido ${pedido.numero} - ${pedido.loja}`
  }, [pedido])

  if (erro && !pedido) {
    return (
      <main className="loja pedido">
        <div className="loja-vazio"><i className="fa-solid fa-circle-exclamation" aria-hidden="true" /><p role="alert">{erro}</p></div>
      </main>
    )
  }
  if (!pedido) {
    return (
      <main className="loja pedido" aria-busy="true" aria-label="Carregando pedido">
        <div className="pedido-topo pedido-topo--esqueleto" />
        <div className="pedido-corpo">
          <div className="pedido-cartao pedido-cartao--esqueleto" />
          <div className="pedido-cartao pedido-cartao--esqueleto" />
        </div>
      </main>
    )
  }

  const emRota = pedido.categoria === 'SAIU_PARA_ENTREGA'
  const momento = MOMENTOS[pedido.categoria] ?? MOMENTOS.PENDENTE
  const ativo = !pedido.cancelado && !pedido.concluido
  const minutosRestantes = pedido.previsaoPreparo ? Math.max(0, Math.round((new Date(pedido.previsaoPreparo) - Date.now()) / 60000)) : null
  const telefoneLoja = pedido.lojaTelefone?.replace(/\D/g, '')
  const taxa = Number(pedido.taxaEntrega ?? 0)

  return (
    <main className="loja pedido">
      <header className="pedido-topo">
        {pedido.logoUrl
          ? <img src={pedido.logoUrl} alt="" />
          : <span className="pedido-topo__logo" aria-hidden="true">{pedido.loja.charAt(0)}</span>}
        <div>
          <strong>{pedido.loja}</strong>
          <small>Pedido {pedido.numero} · {hora(pedido.criadoEm)}</small>
        </div>
        {pedido.slug && <Link to={`/${pedido.slug}`} className="pedido-topo__voltar">Ver cardápio</Link>}
      </header>

      <div className="pedido-corpo">
        <section className={`pedido-hero pedido-hero--${pedido.categoria}`} aria-live="polite">
          <span className="pedido-hero__icone" aria-hidden="true"><i className={`fa-solid ${momento.icone}`} /></span>
          <div>
            <small>Olá, {pedido.cliente}!</small>
            <h1>{pedido.cancelado ? 'Cancelado' : pedido.situacao}</h1>
            <p>{momento.frase}</p>
          </div>
          <AnimacaoMomento pedido={pedido} />
          {emRota && estimativa && (
            <div className="pedido-hero__previsao pedido-hero__previsao--eta">
              <i className="fa-solid fa-route" aria-hidden="true" />
              <span>Chega em <strong>~{estimativa.minutos} min</strong> ({hora(new Date(Date.now() + estimativa.minutos * 60000).toISOString())}) · {estimativa.km.toFixed(1).replace('.', ',')} km</span>
            </div>
          )}
          {emRota && pedido.codigoEntrega && (
            <div className="pedido-codigo">
              <span>Código de entrega</span>
              <strong aria-label={`Código ${pedido.codigoEntrega.split('').join(' ')}`}>{pedido.codigoEntrega}</strong>
              <small>Passe estes 4 números ao entregador ao receber o pedido.</small>
            </div>
          )}
          {ativo && !emRota && minutosRestantes !== null && (
            <div className="pedido-hero__previsao">
              <i className="fa-regular fa-clock" aria-hidden="true" />
              <span>Previsão <strong>{hora(pedido.previsaoPreparo)}</strong>{minutosRestantes > 0 ? ` (~${minutosRestantes} min)` : ''}</span>
            </div>
          )}
        </section>

        {pedido.cancelado ? (
          <p className="loja-aviso"><i className="fa-solid fa-circle-info" aria-hidden="true" /><span>Em caso de dúvida, fale com a loja{pedido.lojaTelefone ? `: ${pedido.lojaTelefone}` : ''}.</span></p>
        ) : (
          <section className="pedido-cartao">
            <h2>Andamento</h2>
            <LinhaDoTempo etapas={pedido.etapas} />
          </section>
        )}

        {emRota && pedido.entregador && (
          <section className="pedido-cartao">
            <h2>A caminho</h2>
            <p className="pedido-entregador">
              <span aria-hidden="true"><i className="fa-solid fa-motorcycle" /></span>
              <span><strong>{pedido.entregador.nome}</strong>{pedido.entregador.veiculo ? <small>{pedido.entregador.veiculo}</small> : null}</span>
            </p>
            {pedido.entregador.latitude != null && <MapaEntregador pedido={pedido} aoEstimar={setEstimativa} />}
          </section>
        )}

        <section className="pedido-cartao">
          <h2>Resumo</h2>
          <ul className="pedido-itens">
            {pedido.itens.map((item, i) => (
              <li key={i}><span>{item.quantidade}x {item.nome}</span>{item.total != null && <span>{formatarMoeda(item.total)}</span>}</li>
            ))}
          </ul>
          <dl className="pedido-totais">
            {pedido.subtotal != null && <div><dt>Subtotal</dt><dd>{formatarMoeda(pedido.subtotal)}</dd></div>}
            {pedido.tipoEntrega === 'ENTREGA' && <div><dt>Entrega</dt><dd>{taxa > 0 ? formatarMoeda(taxa) : 'Grátis'}</dd></div>}
            <div className="pedido-totais__total"><dt>Total</dt><dd>{formatarMoeda(pedido.total)}</dd></div>
          </dl>
          <p className="pedido-destino">
            <i className={`fa-solid ${pedido.tipoEntrega === 'ENTREGA' ? 'fa-location-dot' : 'fa-store'}`} aria-hidden="true" />
            {pedido.tipoEntrega === 'ENTREGA' ? `Entrega em ${pedido.destino || 'seu endereço'}` : 'Retirada na loja'}
          </p>
        </section>

        {ativo && avisos === false && pushSuportado() && Notification.permission !== 'denied' && (
          <button type="button" className="pedido-avisos" onClick={ligarAvisos}>
            <i className="fa-solid fa-bell" aria-hidden="true" /> Avisar quando meu pedido mudar de situação
          </button>
        )}
        {ativo && avisos === true && <p className="pedido-avisos pedido-avisos--ligado"><i className="fa-solid fa-bell" aria-hidden="true" /> Você será avisado a cada mudança.</p>}

        <section className="pedido-ajuda">
          {pedido.lojaTelefone && (
            <a className="loja-botao loja-botao--sec" target="_blank" rel="noopener noreferrer"
               href={`https://wa.me/55${telefoneLoja}?text=${encodeURIComponent(`Olá! Quero acompanhar o pedido ${pedido.numero}: ${window.location.href}`)}`}>
              <i className="fa-brands fa-whatsapp" aria-hidden="true" /> Acompanhar pedido pelo WhatsApp
            </a>
          )}
          {pedido.slug && <Link className="loja-botao" to={`/${pedido.slug}/pedidos`}>Meus pedidos</Link>}
        </section>
      </div>
    </main>
  )
}
