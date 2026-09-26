import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import useEmblaCarousel from 'embla-carousel-react'
import { Dialog } from 'primereact/dialog'
import { useCarrinho } from '../../context/CarrinhoContext'
import { formatarMoeda } from '../../utils/formatadores'
import { useCliente } from '../../context/ClienteContext'
import { listarPedidosCliente } from '../../api/clienteApi'
import { useInstalarApp } from '../../utils/instalarApp'
import Estrelas from '../../components/Estrelas'

const semAcento = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const horaCurta = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

/** "Abre hoje às 18:00" / "Abre seg às 18:00" a partir da próxima mudança de estado. */
function textoProximaAbertura(iso) {
  if (!iso) return null
  const data = new Date(iso)
  const dia = data.toDateString() === new Date().toDateString()
    ? 'hoje'
    : data.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
  return `Abre ${dia} às ${horaCurta(iso)}`
}

/** Compartilha o link do cardápio (menu nativo do celular) ou copia, quando o navegador não tem compartilhamento. */
function BotaoCompartilhar({ nome }) {
  const [copiado, setCopiado] = useState(false)

  async function compartilhar() {
    const url = window.location.href.split('#')[0]
    if (navigator.share) {
      navigator.share({ title: nome, text: `Confira o cardápio de ${nome}`, url }).catch(() => {})
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // sem permissão de área de transferência: nada a fazer
    }
  }

  return (
    <button type="button" className="loja-compartilhar" onClick={compartilhar} aria-label="Copiar ou compartilhar o link do cardápio">
      <i className={`fa-solid ${copiado ? 'fa-check' : 'fa-link'}`} aria-hidden="true" />
      <span aria-live="polite">{copiado ? 'Link copiado' : 'Compartilhar'}</span>
    </button>
  )
}

/** Preço do produto; em promoção mostra o normal riscado e o percentual de desconto. */
/** Selos e restrições alimentares dos produtos (o código vem do cadastro do produto). */
export const SELOS = {
  VEGANO: { rotulo: 'Vegano', icone: 'fa-leaf' },
  VEGETARIANO: { rotulo: 'Vegetariano', icone: 'fa-seedling' },
  SEM_GLUTEN: { rotulo: 'Sem glúten', icone: 'fa-wheat-awn-circle-exclamation' },
  SEM_LACTOSE: { rotulo: 'Sem lactose', icone: 'fa-droplet-slash' },
  PICANTE: { rotulo: 'Picante', icone: 'fa-pepper-hot' },
}

function Selos({ selos }) {
  if (!selos?.length) return null
  return (
    <span className="loja-selos">
      {selos.filter((s) => SELOS[s]).map((s) => (
        <span key={s} className="loja-selos__item"><i className={`fa-solid ${SELOS[s].icone}`} aria-hidden="true" /> {SELOS[s].rotulo}</span>
      ))}
    </span>
  )
}

function Preco({ produto }) {
  if (!produto.precoOriginal) return <span className="loja-produto__preco">{formatarMoeda(produto.preco)}</span>
  const desconto = Math.round((1 - produto.preco / produto.precoOriginal) * 100)
  return (
    <span className="loja-produto__preco loja-produto__preco--promo">
      {formatarMoeda(produto.preco)}
      <s>{formatarMoeda(produto.precoOriginal)}</s>
      <em>-{desconto}%</em>
      {produto.promocaoQuando && <small className="loja-produto__quando">{produto.promocaoQuando}</small>}
    </span>
  )
}

/** Faixa horizontal de produtos (destaques, promoções, peça novamente), com setas no computador. */
function Carrossel({ titulo, icone, produtos, aoAbrir, desabilitado }) {
  // Embla: arrastar com o mouse ou o dedo (com inércia), sem prender em posições fixas
  const [faixa, carrossel] = useEmblaCarousel({ align: 'start', dragFree: true, containScroll: 'trimSnaps' })
  if (produtos.length === 0) return null

  return (
    <section className="loja-carrossel" aria-label={titulo}>
      <header>
        <h2><i className={`fa-solid ${icone}`} aria-hidden="true" /> {titulo}</h2>
        <span className="loja-carrossel__setas">
          <button type="button" aria-label="Anterior" onClick={() => carrossel?.scrollPrev()}><i className="fa-solid fa-chevron-left" /></button>
          <button type="button" aria-label="Próximo" onClick={() => carrossel?.scrollNext()}><i className="fa-solid fa-chevron-right" /></button>
        </span>
      </header>
      <div ref={faixa} className="loja-carrossel__faixa">
        <div className="loja-carrossel__trilho">
        {produtos.map((p) => (
          <button key={p.guid} type="button" className="loja-destaque" disabled={desabilitado || p.indisponivel} onClick={() => aoAbrir(p)}
                  aria-label={`${p.nome}, ${formatarMoeda(p.preco)}`}>
            <span className="loja-destaque__foto">
              {p.imagemUrl ? <img src={p.imagemUrl} alt="" loading="lazy" /> : <i className="fa-solid fa-utensils" aria-hidden="true" />}
              {p.precoOriginal && <em className="loja-destaque__selo">-{Math.round((1 - p.preco / p.precoOriginal) * 100)}%</em>}
            </span>
            <strong>{p.nome}</strong>
            <Preco produto={p} />
          </button>
        ))}
        </div>
      </div>
    </section>
  )
}

function CartaoProduto({ produto, noCarrinho, aoAbrir, desabilitado }) {
  const bloqueado = desabilitado || produto.indisponivel
  return (
    <button type="button" className={`loja-produto${produto.indisponivel ? ' loja-produto--indisponivel' : ''}`} onClick={() => aoAbrir(produto)} disabled={bloqueado}
            aria-label={`${produto.nome}, ${formatarMoeda(produto.preco)}${noCarrinho ? `, ${noCarrinho} no carrinho` : ''}`}>
      <span className="loja-produto__texto">
        <strong>{produto.nome}</strong>
        {produto.descricao && <small>{produto.descricao}</small>}
        <Selos selos={produto.selos} />
        {produto.indisponivel ? <span className="loja-produto__aviso">{produto.motivoIndisponivel}</span> : <Preco produto={produto} />}
      </span>
      <span className="loja-produto__foto">
        {produto.imagemUrl
          ? <img src={produto.imagemUrl} alt="" loading="lazy" />
          : <i className="fa-solid fa-utensils" aria-hidden="true" />}
        {!bloqueado && (
          <span className={`loja-produto__mais${noCarrinho ? ' loja-produto__mais--qtd' : ''}`} aria-hidden="true">
            {noCarrinho || <i className="fa-solid fa-plus" />}
          </span>
        )}
      </span>
    </button>
  )
}

/** "Instalar app": abre a instalação do navegador; no iPhone mostra o passo a passo manual. */
function BotaoInstalar() {
  const { podeInstalar, ehIphone, instalar } = useInstalarApp()
  const [ajuda, setAjuda] = useState(false)
  if (!podeInstalar) return null
  return (
    <>
      <button type="button" className="loja-compartilhar" onClick={() => (ehIphone ? setAjuda(true) : instalar())}>
        <i className="fa-solid fa-mobile-screen-button" aria-hidden="true" /> Instalar app
      </button>
      {ajuda && (
        <Dialog visible header="Instalar no iPhone" onHide={() => setAjuda(false)} className="loja-dialogo" dismissableMask
                style={{ width: 'min(24rem, 96vw)' }}>
          <ol className="loja-passos-ios">
            <li>Toque em <strong>Compartilhar</strong> <i className="fa-solid fa-arrow-up-from-bracket" aria-hidden="true" /> na barra do Safari.</li>
            <li>Escolha <strong>Adicionar à Tela de Início</strong>.</li>
            <li>Confirme em <strong>Adicionar</strong>.</li>
          </ol>
        </Dialog>
      )}
    </>
  )
}

/** Detalhe do produto: quantidade e observação antes de ir ao carrinho. */
function DialogoProduto({ produto, aoFechar, centralizado }) {
  const { adicionarItem } = useCarrinho()
  const [quantidade, setQuantidade] = useState(1)
  const [observacao, setObservacao] = useState('')

  function adicionar() {
    adicionarItem(produto, quantidade, observacao.trim())
    aoFechar()
  }

  return (
    <Dialog visible header={null} showHeader={false} onHide={aoFechar} className="loja-dialogo" dismissableMask draggable={false}
            position={centralizado ? 'center' : 'bottom'} style={{ width: 'min(32rem, 100vw)' }} contentClassName="loja-dialogo__conteudo">
      <div className={`loja-dialogo__capa${produto.imagemUrl ? '' : ' loja-dialogo__capa--vazia'}`}>
        {produto.imagemUrl ? <img src={produto.imagemUrl} alt="" /> : <i className="fa-solid fa-utensils" aria-hidden="true" />}
        <button type="button" className="loja-dialogo__fechar" aria-label="Fechar" onClick={aoFechar}>
          <i className="fa-solid fa-xmark" />
        </button>
      </div>
      <div className="loja-dialogo__corpo">
        <h2>{produto.nome}</h2>
        {produto.descricao && <p className="loja-dialogo__descricao">{produto.descricao}</p>}
        <p className="loja-dialogo__preco">{formatarMoeda(produto.preco)}</p>
        <label className="loja-campo">
          Alguma observação?
          <textarea rows={2} maxLength={200} value={observacao} onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Ex.: sem cebola, ponto da carne..." />
        </label>
      </div>
      <div className="loja-dialogo__rodape">
        <div className="loja-quantidade">
          <button type="button" aria-label="Diminuir" disabled={quantidade <= 1} onClick={() => setQuantidade((q) => q - 1)}>
            <i className="fa-solid fa-minus" />
          </button>
          <span aria-live="polite">{quantidade}</span>
          <button type="button" aria-label="Aumentar" onClick={() => setQuantidade((q) => q + 1)}>
            <i className="fa-solid fa-plus" />
          </button>
        </div>
        <button type="button" className="loja-botao" onClick={adicionar}>
          <span>Adicionar</span>
          <strong>{formatarMoeda(produto.preco * quantidade)}</strong>
        </button>
      </div>
    </Dialog>
  )
}

/** Verdadeiro em telas largas (computador): a sacola fica fixa na lateral e o detalhe do produto abre no centro. */
function useTelaLarga() {
  const consulta = '(min-width: 1024px)'
  const [larga, setLarga] = useState(() => window.matchMedia(consulta).matches)
  useEffect(() => {
    const mq = window.matchMedia(consulta)
    const aoMudar = (e) => setLarga(e.matches)
    mq.addEventListener('change', aoMudar)
    return () => mq.removeEventListener('change', aoMudar)
  }, [])
  return larga
}

/** Sacola lateral (computador): itens, quantidades, subtotal e ida ao checkout sem sair do cardápio. */
function SacolaLateral({ slug, minimo, aberta }) {
  const navigate = useNavigate()
  const { itens, alterarQuantidade, subtotal } = useCarrinho()
  const falta = minimo > 0 ? minimo - subtotal : 0

  return (
    <aside className="loja-sacola" aria-label="Sua sacola">
      <h2><i className="fa-solid fa-bag-shopping" aria-hidden="true" /> Sua sacola</h2>
      {itens.length === 0 ? (
        <div className="loja-sacola__vazia">
          <i className="fa-solid fa-basket-shopping" aria-hidden="true" />
          <p>Sua sacola está vazia.<br />Escolha algo gostoso no cardápio.</p>
        </div>
      ) : (
        <>
          <ul className="loja-sacola__itens">
            {itens.map((item) => (
              <li key={`${item.produtoGuid}-${item.observacoes}`}>
                <div>
                  <strong>{item.nome}</strong>
                  {item.observacoes && <small>{item.observacoes}</small>}
                  <span>{formatarMoeda(item.preco * item.quantidade)}</span>
                </div>
                <div className="loja-quantidade loja-quantidade--compacta">
                  <button type="button" aria-label={item.quantidade === 1 ? 'Remover' : 'Diminuir'}
                          onClick={() => alterarQuantidade(item.produtoGuid, item.observacoes, item.quantidade - 1)}>
                    <i className={`fa-solid ${item.quantidade === 1 ? 'fa-trash-can' : 'fa-minus'}`} />
                  </button>
                  <span>{item.quantidade}</span>
                  <button type="button" aria-label="Aumentar"
                          onClick={() => alterarQuantidade(item.produtoGuid, item.observacoes, item.quantidade + 1)}>
                    <i className="fa-solid fa-plus" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p className="loja-sacola__subtotal"><span>Subtotal</span><strong>{formatarMoeda(subtotal)}</strong></p>
          {falta > 0 && <small className="loja-resumo__aviso">Faltam {formatarMoeda(falta)} para o pedido mínimo.</small>}
          <button type="button" className="loja-botao" disabled={falta > 0 || !aberta} onClick={() => navigate(`/${slug}/checkout`)}>
            {aberta ? 'Finalizar pedido' : 'Loja fechada'}
          </button>
        </>
      )}
    </aside>
  )
}

/** Marca o chip da categoria que está visível na tela enquanto o cliente rola o cardápio. */
function useCategoriaAtiva(guids) {
  const [ativa, setAtiva] = useState(guids[0] ?? null)
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined
    const observador = new IntersectionObserver(
      (entradas) => {
        const visivel = entradas.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visivel) setAtiva(visivel.target.dataset.guid)
      },
      { rootMargin: '-140px 0px -60% 0px' },
    )
    guids.forEach((g) => {
      const el = document.getElementById(`cat-${g}`)
      if (el) observador.observe(el)
    })
    return () => observador.disconnect()
  }, [guids])
  return [ativa, setAtiva]
}

/** Cardápio digital da loja (/:slug): capa com situação, busca, categorias e barra do carrinho. */
export default function PaginaCardapio() {
  const { cardapio, slug } = useOutletContext()
  const { loja, aberta, proximaMudanca, categorias, motivoFechado, pausadoAte } = cardapio
  const { itens, totalItens, subtotal } = useCarrinho()
  const { cliente, abrirLogin } = useCliente()
  const [historico, setHistorico] = useState([])
  const [busca, setBusca] = useState('')
  const [produto, setProduto] = useState(null)
  const chips = useRef(null)
  const telaLarga = useTelaLarga()

  const [selosAtivos, setSelosAtivos] = useState([])
  const selosDisponiveis = useMemo(
    () => Object.keys(SELOS).filter((s) => categorias.some((c) => c.produtos.some((p) => p.selos?.includes(s)))),
    [categorias],
  )
  const alternarSelo = (s) => setSelosAtivos((atual) => (atual.includes(s) ? atual.filter((x) => x !== s) : [...atual, s]))

  const filtradas = useMemo(() => {
    const termo = semAcento(busca.trim())
    if (!termo && selosAtivos.length === 0) return categorias
    return categorias
      .map((c) => ({
        ...c,
        produtos: c.produtos.filter((p) => (!termo || semAcento(`${p.nome} ${p.descricao ?? ''}`).includes(termo))
          && selosAtivos.every((s) => p.selos?.includes(s))),
      }))
      .filter((c) => c.produtos.length > 0)
  }, [categorias, busca, selosAtivos])

  const quantidades = useMemo(() => itens.reduce((mapa, i) => ({ ...mapa, [i.produtoGuid]: (mapa[i.produtoGuid] ?? 0) + i.quantidade }), {}), [itens])
  const todos = useMemo(() => categorias.flatMap((c) => c.produtos), [categorias])
  const maisVendidos = useMemo(() => {
    const porGuid = new Map(todos.map((p) => [p.guid, p]))
    return (cardapio.maisVendidos ?? []).map((g) => porGuid.get(g)).filter(Boolean)
  }, [todos, cardapio.maisVendidos])
  const destaques = useMemo(() => todos.filter((p) => p.destaque && !p.precoOriginal), [todos])
  const promocoes = useMemo(() => todos.filter((p) => p.precoOriginal), [todos])
  // "Peça novamente": produtos dos pedidos anteriores do cliente logado (os mais recentes primeiro)
  useEffect(() => {
    if (!cliente) {
      setHistorico([])
      return
    }
    listarPedidosCliente(slug).then(setHistorico).catch(() => setHistorico([]))
  }, [cliente, slug])
  const pecaNovamente = useMemo(() => {
    const porGuid = new Map(todos.map((p) => [p.guid, p]))
    const vistos = new Set()
    historico.forEach((pedido) => pedido.itens.forEach((i) => vistos.add(i.produtoGuid)))
    return [...vistos].map((g) => porGuid.get(g)).filter(Boolean).slice(0, 10)
  }, [todos, historico])
  const mostrarBlocos = !busca.trim() && selosAtivos.length === 0
  const guids = useMemo(() => filtradas.map((c) => c.guid), [filtradas])
  const [ativa, setAtiva] = useCategoriaAtiva(guids)

  // mantém o chip ativo visível na faixa rolável
  useEffect(() => {
    chips.current?.querySelector(`[data-guid="${ativa}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [ativa])

  function irPara(guid) {
    setAtiva(guid)
    document.getElementById(`cat-${guid}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const abertura = !aberta && textoProximaAbertura(proximaMudanca)
  const minimo = Number(loja.valorMinimoPedido)
  const endereco = [loja.enderecoBairro, loja.enderecoCidade].filter(Boolean).join(', ')

  return (
    <>
      <header className="loja-capa">
        <div className={`loja-capa__fundo${cardapio.site?.bannerUrl ? ' loja-capa__fundo--banner' : ''}`} aria-hidden="true"
             style={cardapio.site?.bannerUrl ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.05), rgba(0,0,0,0.25)), url(${cardapio.site.bannerUrl})` } : undefined} />
        <div className="loja-capa__cartao">
          {loja.logoUrl
            ? <img className="loja-capa__logo" src={loja.logoUrl} alt="" />
            : <span className="loja-capa__logo loja-capa__logo--vazio" aria-hidden="true">{loja.nome.charAt(0)}</span>}
          <div className="loja-capa__titulo">
            <h1>{loja.nome}</h1>
            {loja.descricao && <p>{loja.descricao}</p>}
          </div>
          <div className="loja-capa__status">
            <span className={`loja-selo ${aberta ? 'loja-selo--aberta' : motivoFechado ? 'loja-selo--pausada' : 'loja-selo--fechada'}`}>
              <span className="loja-selo__ponto" aria-hidden="true" />
              {aberta ? 'Aberta agora' : motivoFechado === 'PAUSADA' ? 'Pedidos pausados' : motivoFechado === 'LOTADA' ? 'Muito movimento' : 'Fechada'}
            </span>
            <BotaoCompartilhar nome={loja.nome} />
            <BotaoInstalar />
            {cliente ? (
              <Link className="loja-compartilhar" to={`/${slug}/perfil`}>
                <i className="fa-solid fa-circle-user" aria-hidden="true" /> {(cliente.nome || 'Meus pedidos').split(' ')[0]}
              </Link>
            ) : (
              <button type="button" className="loja-compartilhar" onClick={() => abrirLogin()}>
                <i className="fa-regular fa-circle-user" aria-hidden="true" /> Entrar
              </button>
            )}
          </div>
          <ul className="loja-capa__infos">
            {cardapio.avaliacaoMedia != null && (
              <li className="loja-capa__nota"><i className="fa-solid fa-star" aria-hidden="true" /> <strong>{String(cardapio.avaliacaoMedia).replace('.', ',')}</strong> ({cardapio.totalAvaliacoes})</li>
            )}
            {cardapio.cashbackPercentual != null && (
              <li className="loja-capa__cashback"><i className="fa-solid fa-coins" aria-hidden="true" /> {String(cardapio.cashbackPercentual).replace('.00', '').replace('.', ',')}% de cashback</li>
            )}
            {abertura && <li><i className="fa-regular fa-calendar" aria-hidden="true" /> {abertura}</li>}
            {loja.tempoPreparoPadraoMinutos > 0 && <li><i className="fa-regular fa-clock" aria-hidden="true" /> ~{loja.tempoPreparoPadraoMinutos} min</li>}
            {minimo > 0 && <li><i className="fa-solid fa-bag-shopping" aria-hidden="true" /> Mínimo {formatarMoeda(minimo)}</li>}
            {endereco && <li><i className="fa-solid fa-location-dot" aria-hidden="true" /> {endereco}</li>}
          </ul>
        </div>
      </header>

      <div className="loja-corpo">
      <div className="loja-principal">
      <div className="loja-barra-busca">
        <label className="loja-busca">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar pratos e bebidas" aria-label="Buscar no cardápio" />
        </label>
        {selosDisponiveis.length > 0 && (
          <div className="loja-filtros-selo" role="group" aria-label="Filtrar por restrição">
            {selosDisponiveis.map((s) => (
              <button key={s} type="button" aria-pressed={selosAtivos.includes(s)} className={selosAtivos.includes(s) ? 'ativo' : ''} onClick={() => alternarSelo(s)}>
                <i className={`fa-solid ${SELOS[s].icone}`} aria-hidden="true" /> {SELOS[s].rotulo}
              </button>
            ))}
          </div>
        )}
        {!busca && categorias.length > 1 && (
          <nav ref={chips} className="loja-categorias" aria-label="Categorias">
            {categorias.map((c) => (
              <button key={c.guid} type="button" data-guid={c.guid} className={ativa === c.guid ? 'ativo' : ''}
                      aria-current={ativa === c.guid ? 'true' : undefined} onClick={() => irPara(c.guid)}>
                {c.nome}
              </button>
            ))}
          </nav>
        )}
      </div>

      {!aberta && (
        <p className="loja-aviso" role="status">
          <i className="fa-solid fa-store-slash" aria-hidden="true" />
          <span>
            {motivoFechado === 'PAUSADA'
              ? `Pausamos os pedidos por um momento${pausadoAte ? ` (voltamos por volta das ${horaCurta(pausadoAte)})` : ''}. Você pode ver o cardápio.`
              : motivoFechado === 'LOTADA'
                ? 'Estamos com muitos pedidos agora. Tente de novo em alguns minutos.'
                : 'A loja está fechada agora. Dê uma olhada no cardápio e faça seu pedido quando ela abrir.'}
          </span>
        </p>
      )}

      <main className="loja-conteudo">
        {mostrarBlocos && (
          <>
            <Carrossel titulo="Peça novamente" icone="fa-rotate-right" produtos={pecaNovamente} aoAbrir={setProduto} desabilitado={!aberta} />
            <Carrossel titulo="Mais pedidos" icone="fa-trophy" produtos={maisVendidos} aoAbrir={setProduto} desabilitado={!aberta} />
            <Carrossel titulo="Promoções" icone="fa-tags" produtos={promocoes} aoAbrir={setProduto} desabilitado={!aberta} />
            <Carrossel titulo="Destaques" icone="fa-fire" produtos={destaques} aoAbrir={setProduto} desabilitado={!aberta} />
          </>
        )}
        {filtradas.length === 0 && (
          <div className="loja-vazio">
            <i className="fa-solid fa-bowl-food" aria-hidden="true" />
            <p>{busca ? `Nada encontrado para "${busca}".` : 'Nenhum produto disponível no momento.'}</p>
          </div>
        )}
        {filtradas.map((categoria) => (
          <section key={categoria.guid} id={`cat-${categoria.guid}`} data-guid={categoria.guid} className="loja-secao">
            <h2>{categoria.nome} <small>{categoria.produtos.length}</small></h2>
            <div className="loja-produtos">
              {categoria.produtos.map((p) => (
                <CartaoProduto key={p.guid} produto={p} noCarrinho={quantidades[p.guid]} desabilitado={!aberta} aoAbrir={setProduto} />
              ))}
            </div>
          </section>
        ))}
      </main>
      </div>
      {telaLarga && <SacolaLateral slug={slug} minimo={minimo} aberta={aberta} />}
      </div>

      {(cardapio.site?.sobre || cardapio.site?.instagram || cardapio.site?.facebook || cardapio.site?.whatsapp) && (
        <footer className="loja-rodape-site">
          {cardapio.site.sobre && (<><h2>Sobre {loja.nome}</h2><p>{cardapio.site.sobre}</p></>)}
          <div className="loja-redes">
            {cardapio.site.instagram && <a href={`https://instagram.com/${cardapio.site.instagram}`} target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-instagram" aria-hidden="true" /> @{cardapio.site.instagram}</a>}
            {cardapio.site.facebook && <a href={cardapio.site.facebook.startsWith('http') ? cardapio.site.facebook : `https://facebook.com/${cardapio.site.facebook}`} target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-facebook" aria-hidden="true" /> Facebook</a>}
            {cardapio.site.whatsapp && <a href={`https://wa.me/55${cardapio.site.whatsapp}`} target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-whatsapp" aria-hidden="true" /> WhatsApp</a>}
          </div>
        </footer>
      )}

      {totalItens > 0 && !telaLarga && (
        <Link to={`/${slug}/carrinho`} className="loja-carrinho-barra">
          <span className="loja-carrinho-barra__icone">
            <i className="fa-solid fa-bag-shopping" aria-hidden="true" />
            <span className="loja-carrinho-barra__qtd">{totalItens}</span>
          </span>
          <span>Ver sacola</span>
          <strong>{formatarMoeda(subtotal)}</strong>
        </Link>
      )}

      {produto && <DialogoProduto produto={produto} centralizado={telaLarga} aoFechar={() => setProduto(null)} />}
    </>
  )
}
