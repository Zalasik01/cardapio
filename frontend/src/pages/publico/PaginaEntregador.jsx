import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  entregadorEntregou, entregadorSaiu, enviarPosicaoEntregador, obterPainelEntregador,
} from '../../api/entregadoresApi'
import { formatarMoeda, formatarTelefone } from '../../utils/formatadores'

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

function CartaoEntrega({ entrega, ocupado, aoSair, aoEntregar }) {
  const seletorFoto = useRef(null)
  const [foto, setFoto] = useState(null)
  const aReceber = entrega.pagamentos?.length ? entrega.pagamentos : null

  return (
    <article className="entregador__cartao">
      <header className="entregador__topo">
        <strong>Pedido {entrega.id}</strong>
        <span className="selo selo--situacao" style={{ '--cor-selo': entrega.cor }}>{entrega.situacao}</span>
      </header>

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
          <input ref={seletorFoto} type="file" accept="image/*" capture="environment" hidden
                 onChange={(e) => setFoto(e.target.files?.[0] ?? null)} />
          <button type="button" className="entregador__botao entregador__botao--secundario" onClick={() => seletorFoto.current.click()}>
            <i className="fa-solid fa-camera" aria-hidden="true" /> {foto ? 'Trocar foto' : 'Foto da entrega (opcional)'}
          </button>
          {foto && <small>Foto: {foto.name}</small>}
          <button type="button" className="entregador__botao entregador__botao--sucesso" disabled={ocupado}
                  onClick={() => aoEntregar(entrega.id, foto)}>
            <i className="fa-solid fa-check" aria-hidden="true" /> Entregue
          </button>
        </div>
      )}
    </article>
  )
}

/**
 * Página do entregador (celular, sem login): /entregador/:token. Mostra só as entregas dele, com rota, ligação para
 * o cliente, "saí para entrega" e "entregue" (com foto). Envia a posição do GPS enquanto houver entrega em rota.
 * Pode ser instalada como aplicativo (PWA).
 */
export default function PaginaEntregador() {
  const { token } = useParams()
  const [painel, setPainel] = useState(null)
  const [erro, setErro] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  usePwa(token)

  const carregar = useCallback(() => {
    obterPainelEntregador(token).then((dados) => { setPainel(dados); setErro(null) })
      .catch((e) => setErro(e.mensagem || 'Não foi possível carregar as entregas.'))
  }, [token])

  useEffect(() => {
    document.title = 'Minhas entregas'
    carregar()
    const intervalo = setInterval(carregar, ATUALIZA_A_CADA_MS)
    return () => clearInterval(intervalo)
  }, [carregar])

  const emRota = !!painel?.entregas.some((e) => e.podeEntregar)
  useGps(token, emRota)

  async function executar(acao) {
    setOcupado(true)
    try {
      await acao()
      carregar()
    } catch (e) {
      setErro(e.mensagem || 'Não foi possível concluir a ação.')
    } finally {
      setOcupado(false)
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

      {erro && <p className="entregador__erro" role="alert">{erro}</p>}

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
        <CartaoEntrega key={entrega.id} entrega={entrega} ocupado={ocupado}
                       aoSair={(id) => executar(() => entregadorSaiu(token, id))}
                       aoEntregar={(id, foto) => executar(() => entregadorEntregou(token, id, foto))} />
      ))}

      {emRota && <p className="entregador__gps"><i className="fa-solid fa-location-crosshairs" aria-hidden="true" /> Compartilhando sua posição com o cliente</p>}
    </main>
  )
}
