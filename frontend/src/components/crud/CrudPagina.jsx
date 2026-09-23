/**
 * Moldura padrao das telas de cadastro (CRUD): cabecalho com "voltar", conteudo e
 * barra de acoes fixa na base da tela.
 */
export default function CrudPagina({ titulo, subtitulo, aoVoltar, rodape, children }) {
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

      <div className="crud__corpo">{children}</div>

      {rodape && <footer className="crud__rodape">{rodape}</footer>}
    </div>
  )
}
