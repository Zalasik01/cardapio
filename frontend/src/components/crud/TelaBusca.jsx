import { useCallback, useEffect, useRef, useState } from 'react'
import Drawer from '../Drawer'
import { TabelaSkeleton } from '../Skeleton'

/**
 * Tela de busca padrao: campo de busca + lupa + filtros (drawer) + botao "Novo",
 * tabela com skeleton, estado vazio e paginacao. Todas as telas de listagem usam
 * este componente para manter o mesmo comportamento.
 *
 * Props:
 *  - titulo, placeholder, rotuloNovo
 *  - colunas: [{ chave, cabecalho, render?(linha) }]
 *  - buscar({ busca, filtros, page, size }) -> Promise<{ content, page, totalElements, totalPages }>
 *  - filtros: [{ nome, rotulo, tipo: 'texto' | 'selecao', opcoes?: [{ valor, rotulo }] }]
 *  - aoNovo(), aoAbrir(linha), chaveLinha(linha)
 */
export default function TelaBusca({
  titulo,
  colunas,
  buscar,
  filtros = [],
  aoNovo,
  aoAbrir,
  chaveLinha,
  rotuloNovo = 'Novo',
  placeholder = 'Buscar',
  tamanhoPagina = 10,
}) {
  const [termo, setTermo] = useState('')
  const [termoAplicado, setTermoAplicado] = useState('')
  const [rascunho, setRascunho] = useState({})
  const [aplicados, setAplicados] = useState({})
  const [pagina, setPagina] = useState(0)
  const [drawerAberto, setDrawerAberto] = useState(false)

  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  // a funcao de busca pode mudar a cada render do pai; a ref evita refazer a consulta por isso
  const buscarRef = useRef(buscar)
  buscarRef.current = buscar

  useEffect(() => {
    let descartada = false
    setCarregando(true)
    buscarRef
      .current({ busca: termoAplicado, filtros: aplicados, page: pagina, size: tamanhoPagina })
      .then((resposta) => {
        if (descartada) return
        setDados(resposta)
        setErro(null)
      })
      .catch((e) => !descartada && setErro(e.mensagem))
      .finally(() => !descartada && setCarregando(false))
    return () => {
      descartada = true
    }
  }, [termoAplicado, aplicados, pagina, tamanhoPagina])

  const fecharDrawer = useCallback(() => setDrawerAberto(false), [])

  function handleBuscar(e) {
    e.preventDefault()
    setPagina(0)
    setTermoAplicado(termo.trim())
  }

  function abrirFiltros() {
    setRascunho(aplicados)
    setDrawerAberto(true)
  }

  function aplicarFiltros(e) {
    e.preventDefault()
    setPagina(0)
    setAplicados(limpar(rascunho))
    setDrawerAberto(false)
  }

  function limparFiltros() {
    setRascunho({})
    setPagina(0)
    setAplicados({})
    setDrawerAberto(false)
  }

  const totalFiltros = Object.keys(aplicados).length
  const linhas = dados?.content ?? []
  const inicio = dados && dados.totalElements > 0 ? dados.page * dados.size + 1 : 0
  const fim = dados ? dados.page * dados.size + linhas.length : 0
  const cabecalhos = [...colunas.map((coluna) => coluna.cabecalho), '']

  return (
    <div className="pagina-admin tela-busca">
      <h1>{titulo}</h1>

      <form className="barra-busca" role="search" onSubmit={handleBuscar}>
        <div className="barra-busca__campo">
          <input
            type="search"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            autoComplete="off"
          />
          <button type="submit" className="botao-icone barra-busca__icone" aria-label="Buscar" title="Buscar">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          </button>
          {filtros.length > 0 && (
            <button
              type="button"
              className="botao-icone barra-busca__icone barra-busca__filtro"
              aria-label={totalFiltros ? `Filtros (${totalFiltros} aplicados)` : 'Filtros'}
              title="Filtros"
              onClick={abrirFiltros}
            >
              <i className="fa-solid fa-filter" aria-hidden="true" />
              {totalFiltros > 0 && <span className="barra-busca__contador">{totalFiltros}</span>}
            </button>
          )}
        </div>

        {aoNovo && (
          <button type="button" className="barra-busca__novo" onClick={aoNovo}>
            <i className="fa-solid fa-plus" aria-hidden="true" /> {rotuloNovo}
          </button>
        )}
      </form>

      {erro && <p className="mensagem-erro" role="alert">{erro}</p>}

      {carregando && !dados ? (
        <TabelaSkeleton cabecalhos={cabecalhos} linhas={tamanhoPagina > 6 ? 6 : tamanhoPagina} />
      ) : (
        <div className={`tabela-busca ${carregando ? 'tabela-busca--carregando' : ''}`} aria-busy={carregando}>
          <table className="tabela-admin">
            <thead>
              <tr>
                {cabecalhos.map((cabecalho, i) => (
                  <th key={i}>{cabecalho}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha) => (
                <tr key={chaveLinha(linha)} className={aoAbrir ? 'linha-clicavel' : undefined}
                    onDoubleClick={aoAbrir ? () => aoAbrir(linha) : undefined}>
                  {colunas.map((coluna) => (
                    <td key={coluna.chave}>{coluna.render ? coluna.render(linha) : linha[coluna.chave]}</td>
                  ))}
                  <td className="tabela-busca__acoes">
                    {aoAbrir && (
                      <button type="button" className="botao-secundario" onClick={() => aoAbrir(linha)}>
                        <i className="fa-solid fa-pen" aria-hidden="true" /> Abrir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {linhas.length === 0 && (
                <tr>
                  <td colSpan={cabecalhos.length} className="tabela-busca__vazio">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {dados && dados.totalElements > 0 && (
            <nav className="paginacao" aria-label="Paginação">
              <span>Mostrando {inicio}–{fim} de {dados.totalElements}</span>
              <div className="paginacao__controles">
                <button type="button" className="botao-secundario" disabled={dados.page === 0 || carregando}
                        onClick={() => setPagina(dados.page - 1)} aria-label="Página anterior">
                  <i className="fa-solid fa-chevron-left" aria-hidden="true" />
                </button>
                <span>Página {dados.page + 1} de {dados.totalPages}</span>
                <button type="button" className="botao-secundario"
                        disabled={dados.page + 1 >= dados.totalPages || carregando}
                        onClick={() => setPagina(dados.page + 1)} aria-label="Próxima página">
                  <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                </button>
              </div>
            </nav>
          )}
        </div>
      )}

      <Drawer
        aberto={drawerAberto}
        titulo="Filtros"
        aoFechar={fecharDrawer}
        rodape={(
          <>
            <button type="button" className="botao-secundario" onClick={limparFiltros}>Limpar</button>
            <button type="submit" form="form-filtros">Aplicar filtros</button>
          </>
        )}
      >
        <form id="form-filtros" className="drawer__filtros" onSubmit={aplicarFiltros}>
          {filtros.map((filtro) => (
            <label key={filtro.nome}>
              {filtro.rotulo}
              {filtro.tipo === 'selecao' ? (
                <select
                  value={rascunho[filtro.nome] ?? ''}
                  onChange={(e) => setRascunho({ ...rascunho, [filtro.nome]: e.target.value })}
                >
                  <option value="">Todos</option>
                  {filtro.opcoes.map((opcao) => (
                    <option key={opcao.valor} value={opcao.valor}>{opcao.rotulo}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={rascunho[filtro.nome] ?? ''}
                  onChange={(e) => setRascunho({ ...rascunho, [filtro.nome]: e.target.value })}
                />
              )}
            </label>
          ))}
        </form>
      </Drawer>
    </div>
  )
}

/** Remove filtros vazios para contar e enviar so os que realmente filtram. */
function limpar(valores) {
  return Object.fromEntries(
    Object.entries(valores)
      .map(([chave, valor]) => [chave, typeof valor === 'string' ? valor.trim() : valor])
      .filter(([, valor]) => valor !== '' && valor !== undefined && valor !== null),
  )
}
