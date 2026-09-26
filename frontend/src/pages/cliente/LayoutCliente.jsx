import { useEffect, useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { buscarCardapio } from '../../api/cardapioApi'
import { CarrinhoProvider } from '../../context/CarrinhoContext'
import { ClienteProvider } from '../../context/ClienteContext'
import { CardapioSkeleton } from '../../components/Skeleton'
import '../../utils/instalarApp' // guarda o convite de instalação do navegador desde o início

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

  // identidade da loja (Loja > Site): a cor da marca vira o tema do cardápio, inclusive nos diálogos (que ficam fora da página)
  useEffect(() => {
    const cor = cardapio?.site?.corPrimaria
    if (!cor) return undefined
    const raiz = document.documentElement.style
    raiz.setProperty('--marca', cor)
    raiz.setProperty('--marca-escura', `color-mix(in srgb, ${cor} 78%, black)`)
    raiz.setProperty('--marca-suave', `color-mix(in srgb, ${cor} 14%, white)`)
    const tema = document.querySelector('meta[name="theme-color"]')
    if (tema) tema.content = cor
    return () => ['--marca', '--marca-escura', '--marca-suave'].forEach((v) => raiz.removeProperty(v))
  }, [cardapio])

  // PWA: manifesto da loja (abre direto no cardápio dela) e service worker
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'manifest'
    link.href = `/api/publico/lojas/${slug}/manifest.webmanifest`
    const tema = document.createElement('meta')
    tema.name = 'theme-color'
    tema.content = '#dc2626'
    document.head.append(link, tema)
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw-loja.js', { scope: '/' }).catch(() => {})
    return () => {
      link.remove()
      tema.remove()
    }
  }, [slug])

  return (
    <ClienteProvider slug={slug}>
    <CarrinhoProvider slug={slug}>
      <div className="loja">
        {erro && <p className="loja__erro" role="alert">{erro}</p>}
        {!erro && !cardapio && <CardapioSkeleton />}
        {cardapio?.site?.mensagemTopo && <p className="loja-aviso-topo" role="status">{cardapio.site.mensagemTopo}</p>}
        {cardapio && <Outlet context={{ cardapio, slug }} />}
      </div>
    </CarrinhoProvider>
    </ClienteProvider>
  )
}
