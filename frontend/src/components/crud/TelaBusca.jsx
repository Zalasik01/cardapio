import { useCallback, useEffect, useRef, useState } from 'react'
import { InputSwitch } from 'primereact/inputswitch'
import Drawer from '../Drawer'
import { dispatchMsgError } from '../../store/dispatchMsg'
import TabelaDados from '../TabelaDados'
import { lerFiltrosSalvos, salvarFiltros } from '../../utils/filtrosSalvos'

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
 *  - chaveFiltros: identifica a tela no localStorage ("filtros") quando "Manter filtros salvos" esta ligado
 *  - aoNovo(), aoAbrir(linha), chaveLinha(linha)
 *
 * Todo drawer de filtros traz 3 opcoes padrao: "Mostrar inativos" (a busca so traz registros ativos
 * por padrao), "Carregar registros automaticamente" (ligado por padrao) e "Manter filtros salvos".
 * "mostrarInativos" segue junto com os demais valores em filtros, para a funcao buscar repassar a API.
 *  - acoesExtras?(linha) -> itens extras do menu "..." ({ label, icon, command })
 *  - chaveAtualizacao: mude o valor para recarregar a listagem (ex.: apos alterar um registro)
 */
export default function TelaBusca({
  titulo,
  colunas,
  buscar,
  filtros = [],
  aoNovo,
  aoAbrir,
  acoesExtras,
  chaveAtualizacao,
  chaveLinha,
  chaveFiltros,
  rotuloNovo = 'Novo',
  placeholder = 'Buscar',
  tamanhoPagina = 10,
}) {
  // estado inicial: filtros salvos (quando o usuario pediu para mante-los) ou o padrao
  const [salvo] = useState(() => (chaveFiltros ? lerFiltrosSalvos(chaveFiltros) : null))
  const [termo, setTermo] = useState(salvo?.busca ?? '')
  const [termoAplicado, setTermoAplicado] = useState(salvo?.busca ?? '')
  const [rascunho, setRascunho] = useState({})
  const [aplicados, setAplicados] = useState(salvo?.filtros ?? {})
  const [mostrarInativos, setMostrarInativos] = useState(salvo?.mostrarInativos ?? false)
  const [automatico, setAutomatico] = useState(salvo?.automatico ?? true)
  const [manterFiltros, setManterFiltros] = useState(!!salvo)
  const [rascunhoOpcoes, setRascunhoOpcoes] = useState({})
  const [pesquisou, setPesquisou] = useState(false) // com o carregamento automatico desligado, so busca apos a 1a pesquisa
  const [pagina, setPagina] = useState(0)
  const [drawerAberto, setDrawerAberto] = useState(false)

  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(automatico)

  const deveCarregar = automatico || pesquisou

  // a funcao de busca pode mudar a cada render do pai; a ref evita refazer a consulta por isso
  const buscarRef = useRef(buscar)
  buscarRef.current = buscar

  // persiste no localStorage ("filtros") o json do filtro feito, so enquanto "Manter filtros salvos" estiver ligado
  useEffect(() => {
    if (!chaveFiltros) return
    salvarFiltros(chaveFiltros, manterFiltros
      ? { busca: termoAplicado, filtros: aplicados, mostrarInativos, automatico }
      : null)
  }, [chaveFiltros, manterFiltros, termoAplicado, aplicados, mostrarInativos, automatico])

  useEffect(() => {
    if (!deveCarregar) {
      setCarregando(false)
      return undefined
    }
    let descartada = false
    setCarregando(true)
    buscarRef
      .current({ busca: termoAplicado, filtros: { ...aplicados, mostrarInativos }, page: pagina, size: tamanhoPagina })
      .then((resposta) => {
        if (descartada) return
        setDados(resposta)
      })
      .catch((e) => !descartada && dispatchMsgError(e.mensagem))
      .finally(() => !descartada && setCarregando(false))
    return () => {
      descartada = true
    }
  }, [deveCarregar, termoAplicado, aplicados, mostrarInativos, pagina, tamanhoPagina, chaveAtualizacao])

  const fecharDrawer = useCallback(() => setDrawerAberto(false), [])

  function handleBuscar(e) {
    e.preventDefault()
    setPagina(0)
    setPesquisou(true)
    setTermoAplicado(termo.trim())
  }

  function abrirFiltros() {
    setRascunho(aplicados)
    setRascunhoOpcoes({ mostrarInativos, automatico, manterFiltros })
    setDrawerAberto(true)
  }

  function aplicarFiltros(e) {
    e.preventDefault()
    setPagina(0)
    setPesquisou(true)
    setAplicados(limpar(rascunho))
    setMostrarInativos(rascunhoOpcoes.mostrarInativos)
    setAutomatico(rascunhoOpcoes.automatico)
    setManterFiltros(rascunhoOpcoes.manterFiltros)
    setDrawerAberto(false)
  }

  function limparFiltros() {
    setRascunho({})
    setPagina(0)
    setPesquisou(true)
    setAplicados({})
    setMostrarInativos(false)
    setDrawerAberto(false)
  }

  const totalFiltros = Object.keys(aplicados).length + (mostrarInativos ? 1 : 0)
  // a TabelaDados identifica cada linha por um campo unico
  const linhas = (dados?.content ?? []).map((linha) => ({ ...linha, __chave: chaveLinha(linha) }))

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
          {totalFiltros > 0 && (
            <button
              type="button"
              className="botao-icone barra-busca__icone"
              aria-label="Limpar filtros"
              title="Limpar filtros"
              onClick={limparFiltros}
            >
              <i className="fa-solid fa-broom" aria-hidden="true" />
            </button>
          )}
        </div>

        {aoNovo && (
          <button type="button" className="barra-busca__novo" onClick={aoNovo}>
            <i className="fa-solid fa-plus" aria-hidden="true" /> {rotuloNovo}
          </button>
        )}
      </form>

      {!deveCarregar && (
        <p className="texto-auxiliar tela-busca__aviso">
          Carregamento automático desligado. Clique na lupa ou aplique filtros para listar os registros.
        </p>
      )}

      {deveCarregar && (
      <TabelaDados
        dados={linhas}
        chave="__chave"
        carregando={carregando}
        colunas={colunas.map((coluna) => ({ campo: coluna.chave, cabecalho: coluna.cabecalho, corpo: coluna.render }))}
        aoClicarLinha={aoAbrir}
        acoes={aoAbrir || acoesExtras
          ? (linha) => [
            ...(aoAbrir ? [{ label: 'Abrir', icon: 'pi pi-pencil', command: () => aoAbrir(linha) }] : []),
            ...(acoesExtras ? acoesExtras(linha) : []),
          ]
          : undefined}
        paginacao={dados ? { pagina: dados.page, tamanho: dados.size, total: dados.totalElements, aoMudar: setPagina } : undefined}
      />
      )}

      <Drawer
        aberto={drawerAberto}
        titulo="Filtros"
        aoFechar={fecharDrawer}
        rodape={(
          <>
            {totalFiltros > 0 && (
              <button type="button" className="botao-secundario" onClick={limparFiltros}>
                <i className="fa-solid fa-broom" aria-hidden="true" /> Limpar filtros
              </button>
            )}
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
          <div className="drawer__opcoes">
            {OPCOES_PADRAO.map(({ nome, rotulo }) => (
              <label key={nome} className="drawer__opcao">
                <InputSwitch
                  checked={!!rascunhoOpcoes[nome]}
                  onChange={(e) => setRascunhoOpcoes({ ...rascunhoOpcoes, [nome]: e.value })}
                />
                {rotulo}
              </label>
            ))}
          </div>
        </form>
      </Drawer>
    </div>
  )
}

const OPCOES_PADRAO = [
  { nome: 'mostrarInativos', rotulo: 'Mostrar inativos' },
  { nome: 'automatico', rotulo: 'Carregar registros automaticamente' },
  { nome: 'manterFiltros', rotulo: 'Manter filtros salvos' },
]

/** Remove filtros vazios para contar e enviar so os que realmente filtram. */
function limpar(valores) {
  return Object.fromEntries(
    Object.entries(valores)
      .map(([chave, valor]) => [chave, typeof valor === 'string' ? valor.trim() : valor])
      .filter(([, valor]) => valor !== '' && valor !== undefined && valor !== null),
  )
}
