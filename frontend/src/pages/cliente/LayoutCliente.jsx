import { useEffect, useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { buscarCardapio } from '../../api/cardapioApi'
import { CarrinhoProvider } from '../../context/CarrinhoContext'
import { CardapioSkeleton } from '../../components/Skeleton'

/** Carrega a loja e o cardápio uma vez; as telas filhas (cardápio, carrinho, checkout) recebem pelo contexto da rota. */
export default function LayoutCliente() {
  const { slug } = useParams()
  const [cardapio, setCardapio] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    setCardapio(null)
    setErro(null)
    buscarCardapio(slug)
      .then(setCardapio)
      .catch((e) => setErro(e.mensagem || 'Não foi possível carregar o cardápio.'))
  }, [slug])

  useEffect(() => {
    if (cardapio) document.title = cardapio.loja.nome
  }, [cardapio])

  return (
    <CarrinhoProvider slug={slug}>
      <div className="loja">
        {erro && <p className="loja__erro" role="alert">{erro}</p>}
        {!erro && !cardapio && <CardapioSkeleton />}
        {cardapio && <Outlet context={{ cardapio, slug }} />}
      </div>
    </CarrinhoProvider>
  )
}
