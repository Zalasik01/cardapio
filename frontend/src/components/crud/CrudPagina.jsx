import { useEffect, useRef, useState } from 'react'
import { TabMenu } from 'primereact/tabmenu'

/**
 * Moldura padrao das telas de cadastro (CRUD): cabecalho com "voltar", ganchos opcionais
 * (atalhos para os blocos da tela), conteudo e barra de acoes fixa na base da tela.
 *
 * ancoras: [{ id, titulo }] — cada id e o id de um bloco (SecaoCrud). Clicar rola ate o bloco e,
 * enquanto a tela rola, o gancho do bloco visivel fica destacado. Passe undefined enquanto os
 * blocos ainda nao existem (carregando).
 */
export default function CrudPagina({ titulo, subtitulo, aoVoltar, rodape, ancoras, children }) {
  const [ativa, setAtiva] = useState(ancoras?.[0]?.id)
  const raiz = useRef(null)
  const chaveAncoras = ancoras?.map((ancora) => ancora.id).join('|')

  useEffect(() => {
    if (!chaveAncoras) return undefined
    const ids = chaveAncoras.split('|')
    setAtiva(ids[0])

    const area = raiz.current?.closest('.conteudo-admin')
    const observador = new IntersectionObserver(
      (entradas) => {
        const visivel = entradas.find((entrada) => entrada.isIntersecting)
        if (visivel) setAtiva(visivel.target.id)
      },
      // considera "atual" o bloco que cruza a faixa superior da area de rolagem
      { root: area, rootMargin: '-5% 0px -75% 0px', threshold: 0 },
    )
    ids.forEach((id) => {
      const elemento = document.getElementById(id)
      if (elemento) observador.observe(elemento)
    })
    return () => observador.disconnect()
  }, [chaveAncoras])

  function irPara(id) {
    setAtiva(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="pagina-admin crud" ref={raiz}>
      {/* o cabecalho (voltar + titulo) fica dentro do mesmo bloco branco do cadastro */}
      <div className="crud__cartao">
        <header className="crud__cabecalho">
          <button type="button" className="botao-icone crud__voltar" aria-label="Voltar" onClick={aoVoltar}>
            <i className="fa-solid fa-arrow-left" aria-hidden="true" />
          </button>
          <div>
            <h1>{titulo}</h1>
            {subtitulo && <p className="crud__subtitulo">{subtitulo}</p>}
          </div>
        </header>

        {ancoras && (
          <nav className="crud__ancoras" aria-label="Blocos do cadastro">
            <TabMenu
              model={ancoras.map((ancora) => ({ label: ancora.titulo }))}
              activeIndex={Math.max(0, ancoras.findIndex((ancora) => ancora.id === ativa))}
              onTabChange={(e) => irPara(ancoras[e.index].id)}
            />
          </nav>
        )}

        <div className="crud__corpo">{children}</div>
      </div>

      {rodape && <footer className="crud__rodape">{rodape}</footer>}
    </div>
  )
}
