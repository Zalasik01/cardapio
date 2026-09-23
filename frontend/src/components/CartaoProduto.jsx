import { useState } from 'react'
import { useCarrinho } from '../context/CarrinhoContext'
import { formatarMoeda } from '../utils/formatadores'

export default function CartaoProduto({ produto }) {
  const { adicionarItem } = useCarrinho()
  const [quantidade, setQuantidade] = useState(1)
  const [adicionado, setAdicionado] = useState(false)

  function handleAdicionar() {
    adicionarItem(produto, quantidade)
    setQuantidade(1)
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 1200)
  }

  return (
    <div className="cartao-produto">
      {produto.imagemUrl && <img src={produto.imagemUrl} alt={produto.nome} className="cartao-produto__imagem" />}
      <div className="cartao-produto__conteudo">
        <h3>{produto.nome}</h3>
        {produto.descricao && <p className="cartao-produto__descricao">{produto.descricao}</p>}
        <div className="cartao-produto__rodape">
          <span className="cartao-produto__preco">{formatarMoeda(produto.preco)}</span>
          <div className="cartao-produto__acoes">
            <input
              type="number"
              min="1"
              value={quantidade}
              onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))}
            />
            <button type="button" onClick={handleAdicionar}>
              {adicionado ? 'Adicionado!' : 'Adicionar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
