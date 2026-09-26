import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { useCarrinho } from '../../context/CarrinhoContext'
import { formatarMoeda } from '../../utils/formatadores'

/** Carrinho do cliente: ajusta quantidades, remove itens e segue para o checkout. */
export default function PaginaCarrinho() {
  const { cardapio, slug } = useOutletContext()
  const navigate = useNavigate()
  const { itens, alterarQuantidade, subtotal } = useCarrinho()
  const minimo = Number(cardapio.loja.valorMinimoPedido)
  const abaixoDoMinimo = minimo > 0 && subtotal < minimo

  return (
    <div className="loja-pagina">
      <header className="loja-pagina__topo">
        <Link to={`/${slug}`} aria-label="Voltar ao cardápio"><i className="fa-solid fa-arrow-left" /></Link>
        <h1>Seu carrinho</h1>
      </header>

      {itens.length === 0 ? (
        <div className="loja-vazio">
          <p>Seu carrinho está vazio.</p>
          <Link className="loja-botao" to={`/${slug}`}>Ver o cardápio</Link>
        </div>
      ) : (
        <>
          <ul className="loja-itens">
            {itens.map((item) => (
              <li key={`${item.produtoGuid}-${item.observacoes}`}>
                <div>
                  <strong>{item.nome}</strong>
                  {item.observacoes && <small>{item.observacoes}</small>}
                  <span>{formatarMoeda(item.preco * item.quantidade)}</span>
                </div>
                <div className="loja-quantidade">
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

          <div className="loja-resumo">
            <p><span>Subtotal</span><strong>{formatarMoeda(subtotal)}</strong></p>
            {abaixoDoMinimo && <small className="loja-resumo__aviso">Pedido mínimo de {formatarMoeda(minimo)}: faltam {formatarMoeda(minimo - subtotal)}.</small>}
          </div>

          <footer className="loja-rodape-fixo">
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
