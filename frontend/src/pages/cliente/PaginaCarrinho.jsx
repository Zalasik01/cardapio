import { useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { useCarrinho } from '../../context/CarrinhoContext'
import { formatarMoeda } from '../../utils/formatadores'

/** Carrinho do cliente: ajusta quantidades, remove itens e segue para o checkout. */
export default function PaginaCarrinho() {
  const { cardapio, slug } = useOutletContext()
  const navigate = useNavigate()
  const { itens, alterarQuantidade, limparCarrinho, subtotal } = useCarrinho()
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

          <footer className="loja-rodape-fixo loja-rodape-fixo--resumo">
            <div className="loja-rodape-fixo__resumo">
              <p><span>Subtotal</span><strong>{formatarMoeda(subtotal)}</strong></p>
              {abaixoDoMinimo && <small className="loja-resumo__aviso">Pedido mínimo de {formatarMoeda(minimo)}: faltam {formatarMoeda(minimo - subtotal)}.</small>}
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
