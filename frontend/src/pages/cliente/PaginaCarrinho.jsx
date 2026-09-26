import { useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { useCarrinho } from '../../context/CarrinhoContext'
import { formatarMoeda } from '../../utils/formatadores'

/** Carrinho do cliente: ajusta quantidades, remove itens e segue para o checkout. */
export default function PaginaCarrinho() {
  const { cardapio, slug } = useOutletContext()
  const navigate = useNavigate()
  const { itens, alterarQuantidade, limparCarrinho, subtotal, totalItens } = useCarrinho()
  const [confirmandoLimpar, setConfirmandoLimpar] = useState(false)
  const minimo = Number(cardapio.loja.valorMinimoPedido)
  const abaixoDoMinimo = minimo > 0 && subtotal < minimo

  return (
    <div className="loja-pagina">
      <header className="loja-pagina__topo">
        <Link to={`/${slug}`} aria-label="Voltar ao cardápio"><i className="fa-solid fa-arrow-left" /></Link>
        <h1>Seu carrinho</h1>
        {itens.length > 0 && (
          confirmandoLimpar ? (
            <span className="loja-limpar" role="alert">
              Limpar tudo?
              <button type="button" className="loja-link" onClick={() => { limparCarrinho(); setConfirmandoLimpar(false) }}>Sim, limpar</button>
              <button type="button" className="loja-link loja-link--suave" onClick={() => setConfirmandoLimpar(false)}>Não</button>
            </span>
          ) : (
            <button type="button" className="loja-limpar loja-link" onClick={() => setConfirmandoLimpar(true)}>
              <i className="fa-regular fa-trash-can" aria-hidden="true" /> Limpar carrinho
            </button>
          )
        )}
      </header>

      {itens.length === 0 ? (
        <div className="loja-vazio">
          <i className="fa-solid fa-basket-shopping" aria-hidden="true" />
          <p>Seu carrinho está vazio.</p>
          <Link className="loja-botao" to={`/${slug}`}>Ver o cardápio</Link>
        </div>
      ) : (
        <>
          <p className="carrinho-total-itens">{totalItens} {totalItens === 1 ? 'item' : 'itens'} de <strong>{cardapio.loja.nome}</strong></p>

          {minimo > 0 && (
            <div className={`carrinho-minimo${abaixoDoMinimo ? '' : ' carrinho-minimo--ok'}`}>
              <p>
                <i className={`fa-solid ${abaixoDoMinimo ? 'fa-bag-shopping' : 'fa-circle-check'}`} aria-hidden="true" />
                {abaixoDoMinimo
                  ? <>Faltam <strong>{formatarMoeda(minimo - subtotal)}</strong> para o pedido mínimo</>
                  : 'Pedido mínimo atingido'}
              </p>
              <div className="carrinho-minimo__barra"><span style={{ width: `${Math.min(100, (subtotal / minimo) * 100)}%` }} /></div>
            </div>
          )}

          <ul className="carrinho-itens">
            {itens.map((item) => (
              <li key={`${item.produtoGuid}-${item.observacoes}`}>
                <span className="carrinho-itens__foto">
                  {item.imagemUrl ? <img src={item.imagemUrl} alt="" /> : <i className="fa-solid fa-utensils" aria-hidden="true" />}
                </span>
                <div className="carrinho-itens__info">
                  <strong>{item.nome}</strong>
                  {item.observacoes && <small><i className="fa-regular fa-comment" aria-hidden="true" /> {item.observacoes}</small>}
                  <span className="carrinho-itens__unitario">{formatarMoeda(item.preco)} cada</span>
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
                </div>
                <strong className="carrinho-itens__total">{formatarMoeda(item.preco * item.quantidade)}</strong>
              </li>
            ))}
          </ul>

          <Link className="carrinho-mais" to={`/${slug}`}><i className="fa-solid fa-plus" aria-hidden="true" /> Adicionar mais itens</Link>

          <footer className="loja-rodape-fixo loja-rodape-fixo--resumo">
            <div className="loja-rodape-fixo__resumo">
              <p><span>Subtotal</span><strong>{formatarMoeda(subtotal)}</strong></p>
              <small className="loja-resumo__nota">Frete e cupom são calculados no próximo passo.</small>
            </div>
            <button type="button" className="loja-botao" disabled={abaixoDoMinimo || !cardapio.aberta}
                    onClick={() => navigate(`/${slug}/checkout`)}>
              {cardapio.aberta ? 'Continuar' : 'Loja fechada'}
            </button>
          </footer>
        </>
      )}
    </div>
  )
}
