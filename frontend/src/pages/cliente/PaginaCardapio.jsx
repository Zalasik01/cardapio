import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { buscarCardapio } from '../../api/cardapioApi'
import CartaoProduto from '../../components/CartaoProduto'
import BarraCarrinho from '../../components/BarraCarrinho'

export default function PaginaCardapio() {
  const { slug } = useParams()
  const [cardapio, setCardapio] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    setCarregando(true)
    buscarCardapio(slug)
      .then(setCardapio)
      .catch((e) => setErro(e.mensagem || 'Nao foi possivel carregar o cardapio'))
      .finally(() => setCarregando(false))
  }, [slug])

  if (carregando) return <div className="pagina-centralizada">Carregando cardapio...</div>
  if (erro) return <div className="pagina-centralizada pagina-centralizada--erro">{erro}</div>
  if (!cardapio) return null

  const { restaurante, categorias } = cardapio

  return (
    <div className="pagina-cardapio">
      <header className="cabecalho-restaurante">
        {restaurante.logoUrl && <img src={restaurante.logoUrl} alt={restaurante.nome} />}
        <div>
          <h1>{restaurante.nome}</h1>
          {restaurante.descricao && <p>{restaurante.descricao}</p>}
          <p className="cabecalho-restaurante__detalhes">
            Pedido minimo: {Number(restaurante.valorMinimoPedido).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </header>

      {categorias.length === 0 && <p className="pagina-centralizada">Nenhum produto disponivel no momento.</p>}

      {categorias.map((categoria) => (
        <section key={categoria.id} className="secao-categoria">
          <h2>{categoria.nome}</h2>
          <div className="grade-produtos">
            {categoria.produtos.map((produto) => (
              <CartaoProduto key={produto.id} produto={produto} />
            ))}
          </div>
        </section>
      ))}

      <BarraCarrinho slug={slug} />
    </div>
  )
}
