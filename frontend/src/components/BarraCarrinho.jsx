import { Link } from 'react-router-dom'
import { useCarrinho } from '../context/CarrinhoContext'
import { formatarMoeda } from '../utils/formatadores'

export default function BarraCarrinho({ slug }) {
  const { totalItens, subtotal } = useCarrinho()

  if (totalItens === 0) {
    return null
  }

  return (
    <Link to={`/${slug}/carrinho`} className="barra-carrinho">
      <span>{totalItens} {totalItens === 1 ? 'item' : 'itens'}</span>
      <span>Ver carrinho — {formatarMoeda(subtotal)}</span>
    </Link>
  )
}
