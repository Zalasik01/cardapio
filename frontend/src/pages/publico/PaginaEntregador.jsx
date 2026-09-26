import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  entregadorEntregou, entregadorSaiu, enviarPosicaoEntregador, obterPainelEntregador,
} from '../../api/entregadoresApi'
import { formatarMoeda, formatarTelefone } from '../../utils/formatadores'
import {
  comprimirFoto, dataUrlParaArquivo, ehFalhaDeRede, guardarPainel, lerFila, lerPainelGuardado, salvarFila,
} from '../../utils/filaEntregador'
import { ativarPush, pushAtivo, pushSuportado } from '../../utils/push'

// Consulta rápida enquanto a tela está aberta: é o que faz o entregador ver o pedido novo (ou a mudança) em poucos segundos,
// mesmo quando a conexão em tempo real não chega ao celular. Em segundo plano o navegador já reduz sozinho.
const ATUALIZA_A_CADA_MS = 4000
const POSICAO_A_CADA_MS = 20000

/** Rota do Google Maps até o endereço (a origem é o GPS do próprio celular). */
const rotaPara = (entrega) => `https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${encodeURIComponent(entrega.destinoMapa)}`

const soDigitos = (t) => String(t ?? '').replace(/\D/g, '')

/** "há 12 min" / "há 1 h 05". */
function haQuanto(iso) {
  if (!iso) return ''
  const min = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  return `há ${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`
}

/** Registra o app instalável (PWA) desta página: o manifesto é do próprio entregador (abre direto nas entregas dele). */
function usePwa(token) {
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'manifest'
    link.href = `/api/publico/entregador/${token}/manifest.webmanifest`
    document.head.appendChild(link)
    const tema = document.createElement('meta')
    tema.name = 'theme-color'
    tema.content = '#2563eb'
    document.head.appendChild(tema)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-entregador.js', { scope: `/entregador/${token}` }).catch(() => {})
    }
    return () => {
      link.remove()
      tema.remove()
    }
  }, [token])
}

/** Envia a posição do GPS enquanto há entrega em rota, para o cliente acompanhar no mapa. */
function useGps(token, ativo) {
  const ultimoEnvio = useRef(0)
  useEffect(() => {
    if (!ativo || !('geolocation' in navigator)) return undefined
    const id = navigator.geolocation.watchPosition(
      (posicao) => {
        if (Date.now() - ultimoEnvio.current < POSICAO_A_CADA_MS) return
        ultimoEnvio.current = Date.now()
        enviarPosicaoEntregador(token, posicao.coords.latitude, posicao.coords.longitude).catch(() => {})
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [token, ativo])
}

/** Está sem internet? Segue o navegador e reage quando a conexão cai ou volta. */
function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const ligar = () => setOnline(true)
    const desligar = () => setOnline(false)
    window.addEventListener('online', ligar)
    window.addEventListener('offline', desligar)
    return () => {
      window.removeEventListener('online', ligar)
      window.removeEventListener('offline', desligar)
    }
  }, [])
  return online
}

/** Bipe curto + vibração: avisa que chegou entrega nova com a tela aberta (sem arquivo de som). */
function avisarEntregaNova() {
  try {
    navigator.vibrate?.([200, 100, 200])
    const Audio = window.AudioContext || window.webkitAudioContext
    if (!Audio) return
    const ctx = new Audio()
    const osc = ctx.createOscillator()
    const ganho = ctx.createGain()
    osc.connect(ganho)
    ganho.connect(ctx.destination)
    osc.frequency.value = 880
    ganho.gain.setValueAtTime(0.2, ctx.currentTime)
    ganho.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  } catch {
    // sem áudio liberado pelo navegador: só a vibração/aviso visual
  }
}

function CartaoEntrega({ entrega, ocupado, aoSair, aoEntregar, pendente }) {
  const seletorFoto = useRef(null)
  const [foto, setFoto] = useState(null)
  const [codigo, setCodigo] = useState('')
  const [itensAbertos, setItensAbertos] = useState(false)
  const aReceber = entrega.pagamentos?.length ? entrega.pagamentos : null
  const faltaCodigo = entrega.exigeCodigo && !/^\d{4}$/.test(codigo)
  const telefone = soDigitos(entrega.telefone)
  const emRota = entrega.podeEntregar

  return (
    <article className={`entrega${emRota ? ' entrega--rota' : ''}${pendente ? ' entrega--pendente' : ''}`}>
      <header className="entrega__topo">
        <span className="entrega__numero">Pedido {entrega.id}</span>
        <span className="entrega__tempo">{haQuanto(entrega.criadoEm)}</span>
        <span className="selo selo--situacao" style={{ '--cor-selo': entrega.cor }}>{entrega.situacao}</span>
      </header>
      {pendente && <p className="entrega__pendente"><i className="fa-solid fa-cloud-arrow-up" aria-hidden="true" /> Aguardando internet para enviar</p>}

      <div className="entrega__destino">
        <i className="fa-solid fa-location-dot" aria-hidden="true" />
        <div>
          <strong>{entrega.endereco}</strong>
          <span>{entrega.bairro}</span>
        </div>
      </div>

      <div className="entrega__cliente">
        <span><i className="fa-regular fa-user" aria-hidden="true" /> {entrega.cliente}</span>
        {entrega.telefone && <small>{formatarTelefone(entrega.telefone)}</small>}
      </div>

      <div className="entrega__atalhos">
        <a href={rotaPara(entrega)} target="_blank" rel="noopener noreferrer" className="entrega__atalho entrega__atalho--rota">
          <i className="fa-solid fa-diamond-turn-right" aria-hidden="true" /> Rota
        </a>
        {telefone && <a href={`tel:${telefone}`} className="entrega__atalho"><i className="fa-solid fa-phone" aria-hidden="true" /> Ligar</a>}
        {telefone && (
          <a href={`https://wa.me/55${telefone}`} target="_blank" rel="noopener noreferrer" className="entrega__atalho">
            <i className="fa-brands fa-whatsapp" aria-hidden="true" /> WhatsApp
          </a>
        )}
      </div>

      {entrega.observacoes && <p className="entrega__obs"><i className="fa-regular fa-comment-dots" aria-hidden="true" /> {entrega.observacoes}</p>}

      <div className="entrega__receber">
        <span>Receber do cliente</span>
        <strong>{formatarMoeda(entrega.total)}</strong>
        {aReceber
          ? aReceber.map((pg, i) => (
            <small key={i}>
              {pg.forma}: {formatarMoeda(Number(pg.valor) + Number(pg.taxa))}
              {pg.valorRecebido != null && ` (cliente paga ${formatarMoeda(pg.valorRecebido)}, troco ${formatarMoeda(pg.troco)})`}
            </small>
          ))
          : entrega.formaPagamento && <small>{entrega.formaPagamento}</small>}
      </div>

      <button type="button" className="entrega__itens-botao" aria-expanded={itensAbertos} onClick={() => setItensAbertos((v) => !v)}>
        <i className={`fa-solid fa-chevron-${itensAbertos ? 'up' : 'down'}`} aria-hidden="true" /> {entrega.itens.length} item(ns) do pedido
      </button>
      {itensAbertos && (
        <ul className="entrega__itens">
          {entrega.itens.map((item, i) => (
            <li key={i}>{item.quantidade}x {item.nome}{item.observacoes ? <em> — {item.observacoes}</em> : null}</li>
          ))}
        </ul>
      )}

      {entrega.podeSair && (
        <button type="button" className="entregador__botao entrega__principal" disabled={ocupado} onClick={() => aoSair(entrega.id)}>
          <i className="fa-solid fa-motorcycle" aria-hidden="true" /> Saí para entrega
        </button>
      )}

      {emRota && (
        <div className="entregador__conclusao">
          {entrega.exigeCodigo && (
            <label className="entregador__codigo">
              Código de entrega (peça ao cliente)
              <input inputMode="numeric" autoComplete="off" maxLength={4} placeholder="0000" value={codigo}
                     onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))} />
            </label>
          )}
          <input ref={seletorFoto} type="file" accept="image/*" capture="environment" hidden
                 onChange={(e) => setFoto(e.target.files?.[0] ?? null)} />
          <button type="button" className="entregador__botao entregador__botao--secundario" onClick={() => seletorFoto.current.click()}>
            <i className="fa-solid fa-camera" aria-hidden="true" /> {foto ? 'Trocar foto' : 'Foto da entrega (opcional)'}
          </button>
          {foto && <small className="entrega__foto">Foto: {foto.name}</small>}
          <button type="button" className="entregador__botao entregador__botao--sucesso entrega__principal" disabled={ocupado || faltaCodigo}
                  onClick={() => aoEntregar(entrega.id, foto, codigo)}>
            <i className="fa-solid fa-check" aria-hidden="true" /> Entregue
          </button>
        </div>
      )}
    </article>
  )
}

/**
 * Página do entregador (celular, sem login): /entregador/:token. Mostra só as entregas dele — as que já estão na rua e as
 * que aguardam saída — com rota, ligação, WhatsApp, "saí para entrega" e "entregue" (código do cliente e foto). Atualiza a cada
 * poucos segundos, avisa entrega nova (bipe, vibração e push), mostra o resumo do dia e funciona offline (fila de ações).
 */
export default function PaginaEntregador() {
  const { token } = useParams()
  const [painel, setPainel] = useState(() => lerPainelGuardado(token))
  const [erro, setErro] = useState(null)
  const [sucesso, setSucesso] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [fila, setFila] = useState(() => lerFila(token))
  const [avisos, setAvisos] = useState(null) // null = ainda verificando
  const [atualizadoEm, setAtualizadoEm] = useState(null)
  const [, redesenhar] = useState(0)
  const online = useOnline()
  const sincronizando = useRef(false)
  const idsConhecidos = useRef(null)
  usePwa(token)

  const guardarFila = useCallback((nova) => {
    salvarFila(token, nova)
    setFila(nova)
  }, [token])

  const carregar = useCallback(() => (
    obterPainelEntregador(token)
      .then((dados) => {
        const ids = new Set(dados.entregas.map((e) => e.id))
        // entrega que apareceu depois da primeira carga: avisa (a primeira carga só "aprende" o que já existe)
        if (idsConhecidos.current && [...ids].some((id) => !idsConhecidos.current.has(id))) avisarEntregaNova()
        idsConhecidos.current = ids
        setPainel(dados)
        guardarPainel(token, dados)
        setAtualizadoEm(Date.now())
        setErro(null)
      })
      .catch((e) => { if (!ehFalhaDeRede(e)) setErro(e.mensagem || 'Não foi possível carregar as entregas.') })
  ), [token])

  /** Envia a fila offline, na ordem. Para na primeira falha de rede; erro do servidor descarta a ação e avisa. */
  const sincronizar = useCallback(async () => {
    if (sincronizando.current) return
    let restante = lerFila(token)
    if (restante.length === 0) return
    sincronizando.current = true
    try {
      while (restante.length > 0) {
        const acao = restante[0]
        try {
          if (acao.tipo === 'saiu') await entregadorSaiu(token, acao.pedidoId)
          else await entregadorEntregou(token, acao.pedidoId, acao.foto ? await dataUrlParaArquivo(acao.foto) : null, acao.codigo)
        } catch (e) {
          if (ehFalhaDeRede(e)) break
          setErro(`Pedido ${acao.pedidoId}: ${e.mensagem || 'o servidor recusou a ação enviada offline.'}`)
        }
        restante = restante.slice(1)
        guardarFila(restante)
      }
    } finally {
      sincronizando.current = false
    }
    carregar()
  }, [token, guardarFila, carregar])

  useEffect(() => {
    document.title = 'Minhas entregas'
    sincronizar().then(carregar)
    const intervalo = setInterval(() => { if (document.visibilityState === 'visible') { sincronizar(); carregar() } }, ATUALIZA_A_CADA_MS)
    const relogio = setInterval(() => redesenhar((n) => n + 1), 15000) // "há X min" e "atualizado há Xs"
    const aoVoltar = () => { if (document.visibilityState === 'visible') carregar() }
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      clearInterval(intervalo)
      clearInterval(relogio)
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [carregar, sincronizar])

  useEffect(() => {
    if (online) sincronizar()
  }, [online, sincronizar])

  useEffect(() => {
    if (!pushSuportado()) {
      setAvisos(false)
      return
    }
    pushAtivo().then(setAvisos).catch(() => setAvisos(false))
  }, [])

  useEffect(() => {
    if (!sucesso) return undefined
    const t = setTimeout(() => setSucesso(null), 3500)
    return () => clearTimeout(t)
  }, [sucesso])

  const entregas = painel?.entregas ?? []
  const naRua = entregas.filter((e) => e.podeEntregar)
  const aguardando = entregas.filter((e) => !e.podeEntregar)
  useGps(token, naRua.length > 0)

  const pendentes = new Set(fila.map((a) => a.pedidoId))

  /** Aplica a ação no painel guardado enquanto está sem internet (o servidor confirma depois). */
  function aplicarLocalmente(acao) {
    setPainel((atual) => {
      if (!atual) return atual
      const lista = acao.tipo === 'entregue'
        ? atual.entregas.filter((e) => e.id !== acao.pedidoId)
        : atual.entregas.map((e) => (e.id === acao.pedidoId ? { ...e, podeSair: false, podeEntregar: true, situacao: 'Saiu para entrega' } : e))
      const novo = { ...atual, entregas: lista }
      guardarPainel(token, novo)
      return novo
    })
  }

  async function executar(acao, chamada, mensagemOk) {
    setOcupado(true)
    setErro(null)
    try {
      await chamada()
      setSucesso(mensagemOk)
      await carregar()
    } catch (e) {
      if (ehFalhaDeRede(e)) {
        // sem internet: guarda para enviar depois e já mostra o resultado na tela
        guardarFila([...lerFila(token), acao])
        aplicarLocalmente(acao)
        setSucesso('Salvo. Será enviado quando a internet voltar.')
      } else {
        setErro(e.mensagem || 'Não foi possível concluir a ação.')
      }
    } finally {
      setOcupado(false)
    }
  }

  const sair = (id) => executar({ tipo: 'saiu', pedidoId: id }, () => entregadorSaiu(token, id), 'Boa entrega! O cliente já foi avisado.')

  async function entregar(id, foto, codigo) {
    const dataUrl = foto ? await comprimirFoto(foto).catch(() => null) : null
    await executar({ tipo: 'entregue', pedidoId: id, codigo, foto: dataUrl },
      async () => entregadorEntregou(token, id, dataUrl ? await dataUrlParaArquivo(dataUrl) : null, codigo), 'Entrega concluída!')
  }

  async function ligarAvisos() {
    try {
      setAvisos(await ativarPush(`/publico/entregador/${token}/push`))
    } catch {
      setErro('Não foi possível ativar os avisos neste aparelho.')
    }
  }

  const segundos = atualizadoEm ? Math.max(0, Math.round((Date.now() - atualizadoEm) / 1000)) : null

  return (
    <main className="entregador">
      <header className="entregador__cabecalho entregador__cabecalho--fixo">
        <span className="entregador__marca"><i className="fa-solid fa-motorcycle" aria-hidden="true" /></span>
        <div>
          <strong>{painel ? `Olá, ${painel.nome.split(' ')[0]}` : 'Minhas entregas'}</strong>
          {painel && <small>{painel.loja}</small>}
        </div>
        <button type="button" className="entregador__atualizar" onClick={carregar} aria-label="Atualizar agora">
          <span className={`entregador__ponto${online ? '' : ' entregador__ponto--off'}`} aria-hidden="true" />
          <small>{online ? (segundos === null ? 'conectando' : segundos < 10 ? 'ao vivo' : `há ${segundos}s`) : 'sem internet'}</small>
          <i className="fa-solid fa-rotate-right" aria-hidden="true" />
        </button>
      </header>

      {painel && (
        <section className="entregador__resumo" aria-label="Resumo do dia">
          <div><strong>{naRua.length}</strong><small>na rua</small></div>
          <div><strong>{aguardando.length}</strong><small>aguardando</small></div>
          <div><strong>{painel.entreguesHoje ?? 0}</strong><small>entregues hoje</small></div>
          {Number(painel.repasseHoje) > 0 && <div><strong>{formatarMoeda(painel.repasseHoje)}</strong><small>a receber hoje</small></div>}
        </section>
      )}

      {sucesso && <p className="entregador__sucesso" role="status"><i className="fa-solid fa-circle-check" aria-hidden="true" /> {sucesso}</p>}
      {!online && (
        <p className="entregador__offline" role="status">
          <i className="fa-solid fa-wifi" aria-hidden="true" /> Sem internet. Você pode continuar: o que fizer será enviado quando voltar
          {fila.length > 0 ? ` (${fila.length} ação(ões) na fila)` : ''}.
        </p>
      )}
      {online && fila.length > 0 && <p className="entregador__offline" role="status"><i className="fa-solid fa-cloud-arrow-up" aria-hidden="true" /> Enviando {fila.length} ação(ões) guardada(s)...</p>}
      {erro && <p className="entregador__erro" role="alert">{erro}</p>}

      {avisos === false && pushSuportado() && Notification.permission !== 'denied' && (
        <button type="button" className="entregador__botao entregador__botao--secundario entregador__avisos" onClick={ligarAvisos}>
          <i className="fa-solid fa-bell" aria-hidden="true" /> Avisar quando chegar entrega nova
        </button>
      )}

      {!painel && !erro && (
        <div aria-busy="true" aria-label="Carregando entregas">
          <div className="entrega entrega--esqueleto" />
          <div className="entrega entrega--esqueleto" />
        </div>
      )}

      {painel && entregas.length === 0 && (
        <div className="entregador__vazio">
          <i className="fa-solid fa-mug-hot" aria-hidden="true" />
          <p>Nenhuma entrega para você agora.</p>
          <small>Esta tela atualiza sozinha e avisa quando chegar uma nova.</small>
        </div>
      )}

      {naRua.length > 0 && (
        <section aria-label="Na rua">
          <h2 className="entregador__secao"><i className="fa-solid fa-motorcycle" aria-hidden="true" /> Na rua <span>{naRua.length}</span></h2>
          {naRua.map((e) => <CartaoEntrega key={e.id} entrega={e} ocupado={ocupado} pendente={pendentes.has(e.id)} aoSair={sair} aoEntregar={entregar} />)}
        </section>
      )}

      {aguardando.length > 0 && (
        <section aria-label="Aguardando saída">
          <h2 className="entregador__secao"><i className="fa-solid fa-box" aria-hidden="true" /> Para retirar e sair <span>{aguardando.length}</span></h2>
          {aguardando.map((e) => <CartaoEntrega key={e.id} entrega={e} ocupado={ocupado} pendente={pendentes.has(e.id)} aoSair={sair} aoEntregar={entregar} />)}
        </section>
      )}

      {naRua.length > 0 && <p className="entregador__gps"><i className="fa-solid fa-location-crosshairs" aria-hidden="true" /> Compartilhando sua posição com o cliente</p>}
      {avisos === true && <p className="entregador__gps"><i className="fa-solid fa-bell" aria-hidden="true" /> Avisos de nova entrega ligados</p>}
    </main>
  )
}
