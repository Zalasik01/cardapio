import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { buscarPedido } from '../../api/cardapioApi'
import { formatarMoeda } from '../../utils/formatadores'

export default function PaginaConfirmacaoPedido() {
  const { slug, pedidoId } = useParams()
  const [pedido, setPedido] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    buscarPedido(pedidoId)
      .then(setPedido)
      .catch((e) => setErro(e.mensagem || 'Pedido nao encontrado'))
  }, [pedidoId])

  if (erro) return <div className="pagina-centralizada pagina-centralizada--erro">{erro}</div>
  if (!pedido) return <div className="pagina-centralizada">Carregando pedido...</div>

  return (
    <div className="pagina-confirmacao">
      <h1>Pedido confirmado!</h1>
      <p>Numero do pedido: #{pedido.id}</p>
      <p>Status: {pedido.status}</p>

      <ul className="lista-itens-carrinho">
        {pedido.itens.map((item) => (
          <li key={item.id} className="item-carrinho">
            <span>{item.quantidade}x {item.nomeProduto}</span>
            <span>{formatarMoeda(item.totalItem)}</span>
          </li>
        ))}
      </ul>

      <div className="resumo-carrinho">
        <span>Subtotal: {formatarMoeda(pedido.subtotal)}</span>
        <span>Frete: {formatarMoeda(pedido.taxaEntrega)}</span>
        <strong>Total: {formatarMoeda(pedido.total)}</strong>
      </div>

      <Link to={`/${slug}`}>Voltar ao cardapio</Link>
    </div>
  )
}
