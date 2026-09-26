import { useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { Dialog } from 'primereact/dialog'
import { useCarrinho } from '../../context/CarrinhoContext'
import { formatarMoeda } from '../../utils/formatadores'

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

function CartaoProduto({ produto, aoAbrir }) {
  return (
    <button type="button" className="loja-produto" onClick={() => aoAbrir(produto)}>
      <span className="loja-produto__texto">
        <strong>{produto.nome}</strong>
        {produto.descricao && <small>{produto.descricao}</small>}
        <span className="loja-produto__preco">{formatarMoeda(produto.preco)}</span>
      </span>
      {produto.imagemUrl && <img src={produto.imagemUrl} alt="" loading="lazy" />}
      <span className="loja-produto__mais" aria-hidden="true"><i className="fa-solid fa-plus" /></span>
    </button>
  )
}

/** Detalhe do produto: quantidade e observação antes de ir ao carrinho. */
function DialogoProduto({ produto, aoFechar }) {
  const { adicionarItem } = useCarrinho()
  const [quantidade, setQuantidade] = useState(1)
  const [observacao, setObservacao] = useState('')

  function adicionar() {
    adicionarItem(produto, quantidade, observacao.trim())
    aoFechar()
  }

  return (
    <Dialog visible header={produto.nome} onHide={aoFechar} className="loja-dialogo" dismissableMask draggable={false}
            style={{ width: 'min(30rem, 96vw)' }}>
      {produto.imagemUrl && <img className="loja-dialogo__imagem" src={produto.imagemUrl} alt="" />}
      {produto.descricao && <p className="loja-dialogo__descricao">{produto.descricao}</p>}
      <label className="loja-campo">
        Alguma observação?
        <textarea rows={2} maxLength={200} value={observacao} onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Ex.: sem cebola, ponto da carne..." />
      </label>
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
          Adicionar · {formatarMoeda(produto.preco * quantidade)}
        </button>
      </div>
    </Dialog>
  )
}

/** Cardápio digital da loja (/:slug): cabeçalho com situação, busca, categorias e barra do carrinho. */
export default function PaginaCardapio() {
  const { cardapio, slug } = useOutletContext()
  const { loja, aberta, proximaMudanca, categorias } = cardapio
  const { totalItens, subtotal } = useCarrinho()
  const [busca, setBusca] = useState('')
  const [produto, setProduto] = useState(null)

  const filtradas = useMemo(() => {
    const termo = semAcento(busca.trim())
    if (!termo) return categorias
    return categorias
      .map((c) => ({ ...c, produtos: c.produtos.filter((p) => semAcento(`${p.nome} ${p.descricao ?? ''}`).includes(termo)) }))
      .filter((c) => c.produtos.length > 0)
  }, [categorias, busca])

  const irPara = (guid) => document.getElementById(`cat-${guid}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const abertura = !aberta && textoProximaAbertura(proximaMudanca)
  const minimo = Number(loja.valorMinimoPedido)

  return (
    <>
      <header className="loja-topo">
        {loja.logoUrl
          ? <img className="loja-topo__logo" src={loja.logoUrl} alt="" />
          : <span className="loja-topo__logo loja-topo__logo--vazio"><i className="fa-solid fa-store" /></span>}
        <div>
          <h1>{loja.nome}</h1>
          {loja.descricao && <p>{loja.descricao}</p>}
          <div className="loja-topo__infos">
            <span className={`loja-selo ${aberta ? 'loja-selo--aberta' : 'loja-selo--fechada'}`}>{aberta ? 'Aberta agora' : 'Fechada'}</span>
            {abertura && <span>{abertura}</span>}
            {minimo > 0 && <span>Pedido mínimo {formatarMoeda(minimo)}</span>}
            {loja.tempoPreparoPadraoMinutos > 0 && (
              <span><i className="fa-regular fa-clock" aria-hidden="true" /> ~{loja.tempoPreparoPadraoMinutos} min</span>
            )}
          </div>
        </div>
      </header>

      <div className="loja-barra-busca">
        <label className="loja-busca">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar no cardápio" aria-label="Buscar no cardápio" />
        </label>
        {!busca && categorias.length > 1 && (
          <nav className="loja-categorias" aria-label="Categorias">
            {categorias.map((c) => <button key={c.guid} type="button" onClick={() => irPara(c.guid)}>{c.nome}</button>)}
          </nav>
        )}
      </div>

      {!aberta && <p className="loja-aviso">A loja está fechada no momento. Você pode ver o cardápio, mas não é possível fazer pedidos agora.</p>}

      <main className="loja-conteudo">
        {filtradas.length === 0 && (
          <p className="loja-vazio">{busca ? 'Nenhum item encontrado para essa busca.' : 'Nenhum produto disponível no momento.'}</p>
        )}
        {filtradas.map((categoria) => (
          <section key={categoria.guid} id={`cat-${categoria.guid}`} className="loja-secao">
            <h2>{categoria.nome}</h2>
            <div className="loja-produtos">
              {categoria.produtos.map((p) => <CartaoProduto key={p.guid} produto={p} aoAbrir={aberta ? setProduto : () => {}} />)}
            </div>
          </section>
        ))}
      </main>

      {totalItens > 0 && (
        <Link to={`/${slug}/carrinho`} className="loja-carrinho-barra">
          <span className="loja-carrinho-barra__qtd">{totalItens}</span>
          <span>Ver carrinho</span>
          <strong>{formatarMoeda(subtotal)}</strong>
        </Link>
      )}

      {produto && <DialogoProduto produto={produto} aoFechar={() => setProduto(null)} />}
    </>
  )
}
