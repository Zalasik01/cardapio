import { useRef } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Skeleton } from 'primereact/skeleton'
import { Menu } from 'primereact/menu'
import { Button } from 'primereact/button'

const LINHAS_ESQUELETO = 6

/** Botao "..." de cada linha, que abre o menu de acoes (Abrir, Editar, Excluir...). */
function AcoesLinha({ itens }) {
  const menu = useRef(null)
  if (!itens.length) return null

  return (
    <>
      <Button
        type="button"
        icon="pi pi-ellipsis-h"
        rounded
        text
        size="small"
        severity="secondary"
        aria-label="Ações"
        aria-haspopup="menu"
        onClick={(e) => {
          e.stopPropagation() // nao dispara o clique da linha
          menu.current.toggle(e)
        }}
      />
      <Menu model={itens} popup ref={menu} appendTo={document.body} />
    </>
  )
}

/**
 * Tabela padrao do sistema (PrimeReact DataTable): linhas zebradas, skeleton no
 * carregamento inicial, mensagem de vazio e menu de acoes por linha.
 *
 * Props:
 *  - dados: linhas; chave: nome do campo unico de cada linha (ex.: 'id')
 *  - colunas: [{ campo, cabecalho, corpo?(linha) }]
 *  - carregando: mostra skeleton (sem dados ainda) ou indicador de carregamento (ja com dados)
 *  - acoes?(linha) -> [{ label, icon, command, className }]: menu "..." da linha
 *  - aoClicarLinha?(linha)
 *  - paginacao?: { pagina (0-based), tamanho, total, aoMudar(pagina) } para paginacao no servidor
 */
export default function TabelaDados({
  dados, chave, colunas, carregando = false, acoes, aoClicarLinha, paginacao, vazio = 'Nenhum registro encontrado.',
}) {
  const linhas = dados ?? []
  const mostrarEsqueleto = carregando && linhas.length === 0
  const valor = mostrarEsqueleto
    ? Array.from({ length: LINHAS_ESQUELETO }, (_, i) => ({ [chave]: `esqueleto-${i}`, __esqueleto: true }))
    : linhas

  const propsPaginacao = paginacao
    ? {
        lazy: true,
        paginator: paginacao.total > paginacao.tamanho,
        first: paginacao.pagina * paginacao.tamanho,
        rows: paginacao.tamanho,
        totalRecords: paginacao.total,
        onPage: (e) => paginacao.aoMudar(e.page),
        paginatorTemplate: 'PrevPageLink PageLinks NextPageLink CurrentPageReport',
        currentPageReportTemplate: 'Mostrando {first} a {last} de {totalRecords}',
      }
    : {}

  return (
    <DataTable
      value={valor}
      dataKey={chave}
      stripedRows
      size="small"
      rowHover={!!aoClicarLinha && !mostrarEsqueleto}
      loading={carregando && !mostrarEsqueleto}
      emptyMessage={vazio}
      onRowClick={aoClicarLinha && !mostrarEsqueleto ? (e) => aoClicarLinha(e.data) : undefined}
      rowClassName={() => (aoClicarLinha ? 'linha-clicavel' : '')}
      className="tabela-dados"
      aria-busy={carregando}
      {...propsPaginacao}
    >
      {colunas.map((coluna) => (
        <Column
          key={coluna.campo}
          field={coluna.campo}
          header={coluna.cabecalho}
          body={(linha) => {
            if (linha.__esqueleto) return <Skeleton width="70%" height="1rem" />
            return coluna.corpo ? coluna.corpo(linha) : linha[coluna.campo]
          }}
        />
      ))}
      {acoes && (
        <Column
          key="acoes"
          header=""
          style={{ width: '4rem', textAlign: 'right' }}
          body={(linha) => (linha.__esqueleto ? null : <AcoesLinha itens={acoes(linha)} />)}
        />
      )}
    </DataTable>
  )
}
