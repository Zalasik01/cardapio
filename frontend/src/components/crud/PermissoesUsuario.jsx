import { useEffect, useMemo, useState } from 'react'
import { Column } from 'primereact/column'
import { IconField } from 'primereact/iconfield'
import { InputIcon } from 'primereact/inputicon'
import { InputText } from 'primereact/inputtext'
import { Tooltip } from 'primereact/tooltip'
import { TreeTable } from 'primereact/treetable'
import { obterCatalogoPermissoes } from '../../api/permissoesApi'
import { dispatchMsgError } from '../../store/dispatchMsg'
import { Skeleton } from '../Skeleton'

const NIVEIS = [
  { valor: 'NENHUM', icone: 'fa-solid fa-ban', dica: 'Sem acesso' },
  { valor: 'LEITURA', icone: 'fa-solid fa-eye', dica: 'Somente visualizar' },
  { valor: 'ESCRITA', icone: 'fa-solid fa-pencil', dica: 'Visualizar e editar tudo' },
]

const acoesDe = (pagina) => pagina.permissoes.filter((p) => p.tipo === 'ACAO')
const leituraDe = (pagina) => pagina.permissoes.find((p) => p.tipo === 'LEITURA')
const escritaDe = (pagina) => pagina.permissoes.find((p) => p.tipo === 'ESCRITA')

/** Nível de uma tela para quem tem `codigos`: ESCRITA (tudo), LEITURA ou NENHUM. */
function nivelDaPagina(pagina, codigos) {
  const escrita = escritaDe(pagina)
  if (!escrita) return codigos.has(leituraDe(pagina).codigo) ? 'LEITURA' : 'NENHUM'
  if (codigos.has(escrita.codigo) && acoesDe(pagina).every((a) => codigos.has(a.codigo))) return 'ESCRITA'
  return codigos.has(leituraDe(pagina).codigo) ? 'LEITURA' : 'NENHUM'
}

/** Aplica um nível à tela e devolve o novo conjunto de códigos. */
function aplicarNivel(pagina, nivel, codigos) {
  const novo = new Set(codigos)
  pagina.permissoes.forEach((p) => novo.delete(p.codigo))
  if (nivel !== 'NENHUM') novo.add(leituraDe(pagina).codigo)
  if (nivel === 'ESCRITA') pagina.permissoes.forEach((p) => novo.add(p.codigo))
  return novo
}

/** Liga ou desliga uma ação da tela, mantendo a leitura e a "escrita" (todas as ações) coerentes. */
function alternarAcao(pagina, codigo, codigos) {
  const novo = new Set(codigos)
  if (novo.has(codigo)) {
    novo.delete(codigo)
    const escrita = escritaDe(pagina)
    if (escrita) novo.delete(escrita.codigo)
  } else {
    novo.add(codigo)
    novo.add(leituraDe(pagina).codigo)
    const escrita = escritaDe(pagina)
    if (escrita && acoesDe(pagina).every((a) => novo.has(a.codigo))) novo.add(escrita.codigo)
  }
  return novo
}

/** Três botões (sem acesso, leitura, escrita) de uma categoria ou tela. */
function BotoesNivel({ nivel, niveisDisponiveis, desabilitado, aoEscolher }) {
  return (
    <span className="permissoes__botoes">
      {NIVEIS.filter((n) => niveisDisponiveis.includes(n.valor)).map((n) => (
        <button key={n.valor} type="button" disabled={desabilitado} aria-label={n.dica} aria-pressed={nivel === n.valor}
                data-pr-tooltip={n.dica} data-pr-position="top"
                className={`permissoes__botao permissoes__botao--${n.valor.toLowerCase()}${nivel === n.valor ? ' permissoes__botao--ativo' : ''}`}
                onClick={() => aoEscolher(n.valor)}>
          <i className={n.icone} aria-hidden="true" />
        </button>
      ))}
    </span>
  )
}

/**
 * Árvore de permissões do usuário: categoria do menu > telas > ações da tela. Nas categorias e telas os botões
 * definem o nível (sem acesso, leitura, escrita) de tudo que está abaixo; nas ações, ban/ok liga e desliga cada uma.
 *
 * Props: valor (array de códigos), aoAlterar(array), desabilitado (só visualizar), administrador (tem tudo) e
 * aoCopiar (mostra o botão "Copiar de outro usuário").
 */
export default function PermissoesUsuario({ valor, aoAlterar, desabilitado = false, administrador = false, aoCopiar }) {
  const [catalogo, setCatalogo] = useState(null)
  const [expandidos, setExpandidos] = useState({})
  const [filtro, setFiltro] = useState('')
  const codigos = useMemo(() => new Set(valor), [valor])

  useEffect(() => {
    obterCatalogoPermissoes().then(setCatalogo).catch((e) => dispatchMsgError(e.mensagem))
  }, [])

  const nos = useMemo(() => (catalogo ?? []).map((categoria, i) => ({
    key: `c${i}`,
    data: { tipo: 'categoria', nome: categoria.nome, icone: categoria.icone, paginas: categoria.paginas },
    children: categoria.paginas.map((pagina) => ({
      key: pagina.rota,
      data: { tipo: 'pagina', nome: pagina.nome, pagina },
      children: acoesDe(pagina).map((acao) => ({
        key: acao.codigo,
        data: { tipo: 'acao', nome: acao.nome, codigo: acao.codigo, pagina },
      })),
    })),
  })), [catalogo])

  const bloqueado = desabilitado || administrador
  const emitir = (novo) => aoAlterar([...novo])

  function definirCategoria(paginas, nivel) {
    let novo = codigos
    paginas.forEach((pagina) => {
      // telas só de leitura ficam em leitura quando a categoria pede escrita
      novo = aplicarNivel(pagina, nivel === 'ESCRITA' && !escritaDe(pagina) ? 'LEITURA' : nivel, novo)
    })
    emitir(novo)
  }

  function corpoAcoes(no) {
    const { data } = no
    if (data.tipo === 'categoria') {
      // a categoria mostra um nível só quando todas as telas dela estão nele (telas só de leitura valem como escrita)
      const niveis = data.paginas.map((pagina) => {
        const atual = nivelDaPagina(pagina, codigos)
        return { atual, maximo: escritaDe(pagina) ? 'ESCRITA' : 'LEITURA' }
      })
      const nivel = niveis.every((n) => n.atual === n.maximo) ? 'ESCRITA'
        : ['LEITURA', 'NENHUM'].find((alvo) => niveis.every((n) => n.atual === alvo))
      return <BotoesNivel nivel={administrador ? 'ESCRITA' : nivel} niveisDisponiveis={['NENHUM', 'LEITURA', 'ESCRITA']}
                          desabilitado={bloqueado} aoEscolher={(n) => definirCategoria(data.paginas, n)} />
    }
    if (data.tipo === 'pagina') {
      const disponiveis = escritaDe(data.pagina) ? ['NENHUM', 'LEITURA', 'ESCRITA'] : ['NENHUM', 'LEITURA']
      return <BotoesNivel nivel={administrador ? 'ESCRITA' : nivelDaPagina(data.pagina, codigos)} niveisDisponiveis={disponiveis}
                          desabilitado={bloqueado}
                          aoEscolher={(n) => emitir(aplicarNivel(data.pagina, n, codigos))} />
    }
    const tem = administrador || codigos.has(data.codigo)
    return (
      <button type="button" disabled={bloqueado} aria-pressed={tem} aria-label={tem ? 'Permitido' : 'Não permitido'}
              data-pr-tooltip={tem ? 'Permitido' : 'Não permitido'} data-pr-position="top"
              className={`permissoes__botao ${tem ? 'permissoes__botao--escrita permissoes__botao--ativo' : 'permissoes__botao--nenhum'}`}
              onClick={() => emitir(alternarAcao(data.pagina, data.codigo, codigos))}>
        <i className={tem ? 'fa-solid fa-check' : 'fa-solid fa-ban'} aria-hidden="true" />
      </button>
    )
  }

  function corpoNome(no) {
    const { data } = no
    return (
      <span className={`permissoes__nome permissoes__nome--${data.tipo}`}>
        {data.icone && <i className={data.icone} aria-hidden="true" />} {data.nome}
      </span>
    )
  }

  if (!catalogo) {
    return (
      <div className="permissoes">
        {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} altura="1.6rem" />)}
      </div>
    )
  }

  function expandirTudo() {
    const todos = {}
    nos.forEach((n) => {
      todos[n.key] = true
      n.children.forEach((c) => { todos[c.key] = true })
    })
    setExpandidos(todos)
  }

  return (
    <div className="permissoes">
      <Tooltip target=".permissoes__botao" />
      {administrador && (
        <div className="crud__aviso">
          <i className="fa-solid fa-circle-info" aria-hidden="true" /> Administrador da loja tem acesso a tudo, por isso as
          permissões não podem ser alteradas.
        </div>
      )}
      <div className="permissoes__barra">
        <IconField iconPosition="left" className="permissoes__filtro">
          <InputIcon className="pi pi-search" />
          <InputText value={filtro} onChange={(e) => { setFiltro(e.target.value); expandirTudo() }}
                     placeholder="Filtrar telas e permissões" aria-label="Filtrar telas e permissões" />
        </IconField>
        <button type="button" className="permissoes__link" onClick={expandirTudo}>Expandir tudo</button>
        <button type="button" className="permissoes__link" onClick={() => setExpandidos({})}>Recolher tudo</button>
        {aoCopiar && !administrador && !desabilitado && (
          <button type="button" className="permissoes__link permissoes__link--direita" onClick={aoCopiar}>
            <i className="pi pi-copy" aria-hidden="true" /> Copiar de outro usuário
          </button>
        )}
      </div>
      <TreeTable value={nos} expandedKeys={expandidos} onToggle={(e) => setExpandidos(e.value)}
                 globalFilter={filtro} filterMode="lenient" className="permissoes__arvore"
                 emptyMessage="Nenhuma permissão encontrada.">
        <Column field="nome" header="Permissão" expander body={corpoNome} />
        <Column header="Ações" body={corpoAcoes} className="permissoes__coluna-acoes" style={{ width: '9rem' }} />
      </TreeTable>
    </div>
  )
}
