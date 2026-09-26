import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { obterAcompanhamento } from '../../api/entregadoresApi'
import { formatarMoeda } from '../../utils/formatadores'

const POLLING_MS = 30000

const hora = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

/** "há 2 min" da última posição do entregador. */
function haQuanto(iso) {
  const minutos = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  return minutos < 1 ? 'agora' : minutos < 60 ? `há ${minutos} min` : `há ${Math.floor(minutos / 60)} h`
}

/** Mapa (OpenStreetMap) com a posição do entregador; sem chave de API e sem biblioteca. */
function MapaEntregador({ entregador }) {
  const { latitude: lat, longitude: lng } = entregador
  const d = 0.008
  const caixa = `${lng - d},${lat - d},${lng + d},${lat + d}`
  return (
    <div className="acompanhamento__mapa">
      <iframe title="Posição do entregador" loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${caixa}&layer=mapnik&marker=${lat},${lng}`} />
      <small>
        Posição {haQuanto(entregador.posicaoEm)} ·{' '}
        <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noopener noreferrer">abrir no mapa</a>
      </small>
    </div>
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

  const carregar = useCallback(() => {
    obterAcompanhamento(guid).then((dados) => { setPedido(dados); setErro(null) })
      .catch((e) => setErro(/n[ãa]o encontrad/i.test(e.mensagem ?? '') ? 'Pedido não encontrado. Confira o link.' : 'Não foi possível carregar o pedido agora.'))
  }, [guid])

  useEffect(() => {
    carregar()
    const intervalo = setInterval(carregar, POLLING_MS) // reserva caso a conexão em tempo real caia
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
    }
  }, [guid, carregar])

  useEffect(() => {
    if (pedido) document.title = `Pedido ${pedido.numero} - ${pedido.loja}`
  }, [pedido])

  if (erro && !pedido) return <main className="acompanhamento"><p className="acompanhamento__erro" role="alert">{erro}</p></main>
  if (!pedido) {
    return (
      <main className="acompanhamento" aria-busy="true" aria-label="Carregando pedido">
        <div className="acompanhamento__cartao acompanhamento__cartao--esqueleto" />
        <div className="acompanhamento__cartao acompanhamento__cartao--esqueleto" />
      </main>
    )
  }

  const emRota = pedido.categoria === 'SAIU_PARA_ENTREGA'
  return (
    <main className="acompanhamento">
      <header className="acompanhamento__loja">
        {pedido.logoUrl && <img src={pedido.logoUrl} alt="" />}
        <div>
          <strong>{pedido.loja}</strong>
          <small>Pedido {pedido.numero} · {hora(pedido.criadoEm)}</small>
        </div>
      </header>

      <section className="acompanhamento__cartao acompanhamento__situacao" style={{ '--cor-selo': pedido.cor }}>
        <span className="acompanhamento__ponto" aria-hidden="true" />
        <div>
          <small>Olá, {pedido.cliente}! Seu pedido está</small>
          <h1>{pedido.cancelado ? 'Cancelado' : pedido.situacao}</h1>
          {!pedido.cancelado && !pedido.concluido && pedido.previsaoPreparo && !emRota && (
            <small>Previsão de preparo até {hora(pedido.previsaoPreparo)}</small>
          )}
          {pedido.concluido && <small>Obrigado pela preferência!</small>}
        </div>
      </section>

      {pedido.cancelado ? (
        <p className="acompanhamento__aviso">Este pedido foi cancelado. Em caso de dúvida, fale com a loja{pedido.lojaTelefone ? `: ${pedido.lojaTelefone}` : ''}.</p>
      ) : (
        <ol className="acompanhamento__linha" aria-label="Etapas do pedido">
          {pedido.etapas.map((etapa) => (
            <li key={etapa.nome} className={`${etapa.concluida ? 'acompanhamento__etapa--feita ' : ''}${etapa.atual ? 'acompanhamento__etapa--atual' : ''}`}>
              <span className="acompanhamento__marca" style={{ '--cor-etapa': etapa.cor }} aria-hidden="true">
                {etapa.concluida && <i className="fa-solid fa-check" />}
              </span>
              {etapa.nome}
            </li>
          ))}
        </ol>
      )}

      {emRota && pedido.entregador && (
        <section className="acompanhamento__cartao">
          <h2>Seu pedido está a caminho</h2>
          <p>
            <i className="fa-solid fa-motorcycle" aria-hidden="true" /> {pedido.entregador.nome}
            {pedido.entregador.veiculo ? ` · ${pedido.entregador.veiculo}` : ''}
          </p>
          {pedido.entregador.latitude != null && <MapaEntregador entregador={pedido.entregador} />}
        </section>
      )}

      <section className="acompanhamento__cartao">
        <h2>Resumo</h2>
        <ul className="acompanhamento__itens">
          {pedido.itens.map((item, i) => <li key={i}>{item.quantidade}x {item.nome}</li>)}
        </ul>
        <p className="acompanhamento__total"><span>Total</span><strong>{formatarMoeda(pedido.total)}</strong></p>
        <small>
          {pedido.tipoEntrega === 'ENTREGA' ? `Entrega em ${pedido.destino || 'seu endereço'}` : 'Retirada na loja'}
          {pedido.lojaTelefone ? ` · Dúvidas: ${pedido.lojaTelefone}` : ''}
        </small>
      </section>
    </main>
  )
}
