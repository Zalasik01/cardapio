import { useState } from 'react'

/**
 * Layout padrao de CRUD em blocos: cabecalho com "voltar", lista de blocos
 * (Geral, ...) ao lado, conteudo do bloco ativo e rodape de acoes.
 *
 * Props:
 *  - titulo, subtitulo, aoVoltar
 *  - blocos: [{ id, titulo, icone, conteudo }]
 *  - rodape: botoes de acao (Salvar, Cancelar, ...)
 *  - carregando: mostra o conteudo como skeleton (passe o skeleton em `esqueleto`)
 */
export default function CrudBlocos({ titulo, subtitulo, aoVoltar, blocos, rodape, carregando, esqueleto }) {
  const [ativo, setAtivo] = useState(blocos[0]?.id)
  const blocoAtivo = blocos.find((bloco) => bloco.id === ativo) ?? blocos[0]

  return (
    <div className="pagina-admin crud">
      <header className="crud__cabecalho">
        <button type="button" className="botao-icone crud__voltar" aria-label="Voltar" onClick={aoVoltar}>
          <i className="fa-solid fa-arrow-left" aria-hidden="true" />
        </button>
        <div>
          <h1>{titulo}</h1>
          {subtitulo && <p className="crud__subtitulo">{subtitulo}</p>}
        </div>
      </header>

      <div className="crud__corpo">
        <nav className="crud__blocos" aria-label="Blocos do cadastro">
          {blocos.map((bloco) => (
            <button
              key={bloco.id}
              type="button"
              className={`crud__bloco ${bloco.id === blocoAtivo.id ? 'crud__bloco--ativo' : ''}`}
              aria-current={bloco.id === blocoAtivo.id ? 'true' : undefined}
              onClick={() => setAtivo(bloco.id)}
            >
              {bloco.icone && <i className={bloco.icone} aria-hidden="true" />} {bloco.titulo}
            </button>
          ))}
        </nav>

        <section className="crud__conteudo" aria-label={blocoAtivo.titulo}>
          <h2>{blocoAtivo.titulo}</h2>
          {carregando ? esqueleto : blocoAtivo.conteudo}
        </section>
      </div>

      {rodape && <footer className="crud__rodape">{rodape}</footer>}
    </div>
  )
}
