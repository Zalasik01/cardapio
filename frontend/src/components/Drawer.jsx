import { useEffect, useRef } from 'react'

/** Painel lateral direito com fundo escurecido. Fecha com Esc, clique fora ou no X. */
export default function Drawer({ aberto, titulo, aoFechar, children, rodape }) {
  const painel = useRef(null)

  useEffect(() => {
    if (!aberto) return undefined
    const anterior = document.activeElement
    painel.current?.querySelector('input, select, textarea, button')?.focus()

    const aoTeclar = (e) => e.key === 'Escape' && aoFechar()
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      anterior?.focus?.()
    }
  }, [aberto, aoFechar])

  if (!aberto) return null

  return (
    <div className="drawer-fundo" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <aside ref={painel} className="drawer" role="dialog" aria-modal="true" aria-label={titulo}>
        <header className="drawer__cabecalho">
          <h2>{titulo}</h2>
          <button type="button" className="botao-icone drawer__fechar" aria-label="Fechar" onClick={aoFechar}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </header>
        <div className="drawer__corpo">{children}</div>
        {rodape && <footer className="drawer__rodape">{rodape}</footer>}
      </aside>
    </div>
  )
}
