import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCarrinho } from '../../context/CarrinhoContext'
import { formatarMoeda } from '../../utils/formatadores'

export default function PaginaCarrinho() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { itens, alterarQuantidade, removerItem, subtotal } = useCarrinho()

  if (itens.length === 0) {
    return (
      <div className="pagina-centralizada">
        <p>Seu carrinho esta vazio.</p>
        <Link to={`/${slug}`}>Voltar ao cardapio</Link>
      </div>
    )
  }

  return (
    <div className="pagina-carrinho">
      <h1>Seu carrinho</h1>

      <ul className="lista-itens-carrinho">
        {itens.map((item) => (
          <li key={`${item.produtoId}-${item.observacoes}`} className="item-carrinho">
            <div>
              <strong>{item.nome}</strong>
              {item.observacoes && <p className="item-carrinho__obs">{item.observacoes}</p>}
              <span>{formatarMoeda(item.preco)} cada</span>
            </div>
            <div className="item-carrinho__acoes">
              <input
                type="number"
                min="0"
                value={item.quantidade}
                onChange={(e) => alterarQuantidade(item.produtoId, item.observacoes, Number(e.target.value))}
              />
              <button type="button" onClick={() => removerItem(item.produtoId, item.observacoes)}>
                Remover
              </button>
            </div>
            <span className="item-carrinho__total">{formatarMoeda(item.preco * item.quantidade)}</span>
          </li>
        ))}
      </ul>

      <div className="resumo-carrinho">
        <span>Subtotal</span>
        <strong>{formatarMoeda(subtotal)}</strong>
      </div>

      <div className="acoes-carrinho">
        <Link to={`/${slug}`}>Continuar comprando</Link>
        <button type="button" onClick={() => navigate(`/${slug}/checkout`)}>
          Finalizar pedido
        </button>
      </div>
    </div>
  )
}
