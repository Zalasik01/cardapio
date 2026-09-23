import { Outlet, useParams } from 'react-router-dom'
import { CarrinhoProvider } from '../../context/CarrinhoContext'

export default function LayoutCliente() {
  const { slug } = useParams()

  return (
    <CarrinhoProvider slug={slug}>
      <Outlet />
    </CarrinhoProvider>
  )
}
