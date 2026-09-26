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

const ATUALIZA_A_CADA_MS = 15000
const POSICAO_A_CADA_MS = 20000

/** Rota do Google Maps até o endereço (a origem é o GPS do próprio celular). */
const rotaPara = (entrega) => `https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${encodeURIComponent(entrega.destinoMapa)}`

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

function CartaoEntrega({ entrega, ocupado, aoSair, aoEntregar, pendente }) {
  const seletorFoto = useRef(null)
  const [foto, setFoto] = useState(null)
  const [codigo, setCodigo] = useState('')
  const aReceber = entrega.pagamentos?.length ? entrega.pagamentos : null
  const faltaCodigo = entrega.exigeCodigo && !/^\d{4}$/.test(codigo)

  return (
    <article className={`entregador__cartao${pendente ? ' entregador__cartao--pendente' : ''}`}>
      <header className="entregador__topo">
        <strong>Pedido {entrega.id}</strong>
        <span className="selo selo--situacao" style={{ '--cor-selo': entrega.cor }}>{entrega.situacao}</span>
      </header>
      {pendente && <p className="entregador__pendente"><i className="fa-solid fa-cloud-arrow-up" aria-hidden="true" /> Aguardando internet para enviar</p>}

      <div className="entregador__cliente">
        <strong>{entrega.cliente}</strong>
        {entrega.telefone && <a href={`tel:${entrega.telefone}`}>{formatarTelefone(entrega.telefone)}</a>}
      </div>
      <p className="entregador__endereco">{entrega.endereco}<br />{entrega.bairro}</p>

      <ul className="entregador__itens">
        {entrega.itens.map((item, i) => (
          <li key={i}>{item.quantidade}x {item.nome}{item.observacoes ? <em> — {item.observacoes}</em> : null}</li>
        ))}
      </ul>
      {entrega.observacoes && <p className="entregador__obs">Obs.: {entrega.observacoes}</p>}

      <div className="entregador__receber">
        <span>A receber / conferir</span>
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

      <div className="entregador__botoes">
        <a className="entregador__botao entregador__botao--secundario" href={rotaPara(entrega)} target="_blank" rel="noopener noreferrer">
          <i className="fa-solid fa-map-location-dot" aria-hidden="true" /> Abrir rota
        </a>
        {entrega.podeSair && (
          <button type="button" className="entregador__botao" disabled={ocupado} onClick={() => aoSair(entrega.id)}>
            <i className="fa-solid fa-motorcycle" aria-hidden="true" /> Saí para entrega
          </button>
        )}
      </div>

      {entrega.podeEntregar && (
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
          {foto && <small>Foto: {foto.name}</small>}
          <button type="button" className="entregador__botao entregador__botao--sucesso" disabled={ocupado || faltaCodigo}
                  onClick={() => aoEntregar(entrega.id, foto, codigo)}>
            <i className="fa-solid fa-check" aria-hidden="true" /> Entregue
          </button>
        </div>
      )}
    </article>
  )
}

/**
 * Página do entregador (celular, sem login): /entregador/:token. Mostra só as entregas dele, com rota, ligação para
 * o cliente, "saí para entrega" e "entregue" (com código do cliente e foto). Envia a posição do GPS enquanto houver
 * entrega em rota. Instalável (PWA), recebe aviso de nova entrega (push) e funciona sem internet: o último painel fica
 * guardado e as ações feitas offline entram numa fila que é enviada quando a conexão volta.
 */
export default function PaginaEntregador() {
  const { token } = useParams()
  const [painel, setPainel] = useState(() => lerPainelGuardado(token))
  const [erro, setErro] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [fila, setFila] = useState(() => lerFila(token))
  const [avisos, setAvisos] = useState(null) // null = ainda verificando
  const online = useOnline()
  const sincronizando = useRef(false)
  usePwa(token)

  const guardarFila = useCallback((nova) => {
    salvarFila(token, nova)
    setFila(nova)
  }, [token])

  const carregar = useCallback(() => {
    obterPainelEntregador(token)
      .then((dados) => { setPainel(dados); guardarPainel(token, dados); setErro(null) })
      .catch((e) => { if (!ehFalhaDeRede(e)) setErro(e.mensagem || 'Não foi possível carregar as entregas.') })
  }, [token])

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
    const intervalo = setInterval(() => { sincronizar(); carregar() }, ATUALIZA_A_CADA_MS)
    return () => clearInterval(intervalo)
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

  const emRota = !!painel?.entregas.some((e) => e.podeEntregar)
  useGps(token, emRota)

  const pendentes = new Set(fila.map((a) => a.pedidoId))

  /** Aplica a ação no painel guardado enquanto está sem internet (o servidor confirma depois). */
  function aplicarLocalmente(acao) {
    setPainel((atual) => {
      if (!atual) return atual
      const entregas = acao.tipo === 'entregue'
        ? atual.entregas.filter((e) => e.id !== acao.pedidoId)
        : atual.entregas.map((e) => (e.id === acao.pedidoId ? { ...e, podeSair: false, podeEntregar: true, situacao: 'Saiu para entrega' } : e))
      const novo = { ...atual, entregas }
      guardarPainel(token, novo)
      return novo
    })
  }

  async function executar(acao, chamada) {
    setOcupado(true)
    setErro(null)
    try {
      await chamada()
      carregar()
    } catch (e) {
      if (ehFalhaDeRede(e)) {
        // sem internet: guarda para enviar depois e já mostra o resultado na tela
        guardarFila([...lerFila(token), acao])
        aplicarLocalmente(acao)
      } else {
        setErro(e.mensagem || 'Não foi possível concluir a ação.')
      }
    } finally {
      setOcupado(false)
    }
  }

  const sair = (id) => executar({ tipo: 'saiu', pedidoId: id }, () => entregadorSaiu(token, id))

  async function entregar(id, foto, codigo) {
    const dataUrl = foto ? await comprimirFoto(foto).catch(() => null) : null
    await executar({ tipo: 'entregue', pedidoId: id, codigo, foto: dataUrl },
      async () => entregadorEntregou(token, id, dataUrl ? await dataUrlParaArquivo(dataUrl) : null, codigo))
  }

  async function ligarAvisos() {
    try {
      setAvisos(await ativarPush(`/publico/entregador/${token}/push`))
    } catch {
      setErro('Não foi possível ativar os avisos neste aparelho.')
    }
  }

  return (
    <main className="entregador">
      <header className="entregador__cabecalho">
        <span className="entregador__marca"><i className="fa-solid fa-motorcycle" aria-hidden="true" /></span>
        <div>
          <strong>{painel ? `Olá, ${painel.nome.split(' ')[0]}` : 'Minhas entregas'}</strong>
          {painel && <small>{painel.loja}</small>}
        </div>
      </header>

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
      {avisos === true && <p className="entregador__gps"><i className="fa-solid fa-bell" aria-hidden="true" /> Avisos de nova entrega ligados</p>}

      {!painel && !erro && (
        <div aria-busy="true" aria-label="Carregando entregas">
          <div className="entregador__cartao entregador__cartao--esqueleto" />
          <div className="entregador__cartao entregador__cartao--esqueleto" />
        </div>
      )}

      {painel && painel.entregas.length === 0 && (
        <p className="entregador__vazio">Nenhuma entrega para você agora. Esta tela atualiza sozinha.</p>
      )}

      {painel?.entregas.map((entrega) => (
        <CartaoEntrega key={entrega.id} entrega={entrega} ocupado={ocupado} pendente={pendentes.has(entrega.id)}
                       aoSair={sair} aoEntregar={entregar} />
      ))}

      {emRota && <p className="entregador__gps"><i className="fa-solid fa-location-crosshairs" aria-hidden="true" /> Compartilhando sua posição com o cliente</p>}
    </main>
  )
}
