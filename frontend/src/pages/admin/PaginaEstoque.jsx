import { useCallback, useEffect, useState } from 'react'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { Tag } from 'primereact/tag'
import http from '../../api/http'
import { useAuth } from '../../context/AuthContext'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'

const TIPOS = [
  { valor: 'ENTRADA', rotulo: 'Entrada (compra)' },
  { valor: 'PERDA', rotulo: 'Perda / desperdício' },
  { valor: 'AJUSTE', rotulo: 'Ajuste (contagem)' },
]
const ROTULO_TIPO = { ENTRADA: 'Entrada', BAIXA: 'Baixa por pedido', PERDA: 'Perda', AJUSTE: 'Ajuste', ESTORNO: 'Estorno' }
const numero = (v) => Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 3 })

/** Cardápio > Estoque: saldo dos ingredientes, mínimo, entradas/perdas/ajustes e histórico. A baixa dos pedidos é automática. */
export default function PaginaEstoque() {
  const { loja, pode } = useAuth()
  const base = `/admin/lojas/${loja.tenant}/estoque`
  const [lista, setLista] = useState(null)
  const [busca, setBusca] = useState('')
  const [lancando, setLancando] = useState(null) // ingrediente
  const [lanc, setLanc] = useState({ tipo: 'ENTRADA', quantidade: null, motivo: '' })
  const [historico, setHistorico] = useState(null) // { ingrediente, movimentos }
  const [salvando, setSalvando] = useState(false)

  const carregar = useCallback(() => {
    http.get(base).then((r) => setLista(r.data)).catch((e) => dispatchMsgError(e.mensagem))
  }, [base])
  useEffect(() => { carregar() }, [carregar])

  const filtrada = (lista ?? []).filter((i) => i.nome.toLowerCase().includes(busca.toLowerCase()))
  const abaixo = (lista ?? []).filter((i) => i.baixo).length

  async function configurar(i, campos) {
    try {
      await http.put(`${base}/${i.id}/config`, { controla: i.controla, minimo: i.minimo, ...campos })
      carregar()
    } catch (e) {
      dispatchMsgError(e.mensagem)
    }
  }

  async function lancar() {
    setSalvando(true)
    try {
      await http.post(`${base}/${lancando.id}/movimentos`, lanc)
      dispatchMsgSuccess('Movimento lançado com sucesso')
      setLancando(null)
      carregar()
    } catch (e) {
      dispatchMsgError(e.mensagem)
    } finally {
      setSalvando(false)
    }
  }

  async function verHistorico(i) {
    try {
      const r = await http.get(`${base}/${i.id}/movimentos`)
      setHistorico({ ingrediente: i, movimentos: r.data })
    } catch (e) {
      dispatchMsgError(e.mensagem)
    }
  }

  const situacao = (i) => {
    if (!i.controla) return <Tag value="Sem controle" severity="secondary" />
    if (i.atual <= 0) return <Tag value="Acabou" severity="danger" />
    return i.baixo ? <Tag value="Baixo" severity="warning" /> : <Tag value="Ok" severity="success" />
  }

  return (
    <div className="crud">
      <div className="crud__cabecalho">
        <div>
          <h1>Estoque de ingredientes</h1>
          <p className="texto-auxiliar">
            Cada pedido dá baixa pela composição dos produtos; cancelar devolve ao estoque.
            {abaixo > 0 && <strong> {abaixo} ingrediente(s) no mínimo ou abaixo.</strong>}
          </p>
        </div>
        <InputText placeholder="Buscar ingrediente" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar ingrediente" />
      </div>

      <DataTable value={filtrada} loading={lista === null} emptyMessage="Nenhum ingrediente cadastrado" size="small" stripedRows>
        <Column header="Ingrediente" field="nome" />
        <Column header="Saldo" body={(i) => `${numero(i.atual)} ${i.unidade.toLowerCase()}`} />
        <Column header="Mínimo" body={(i) => (pode('ESTOQUE_ALTERAR')
          ? <InputNumber value={Number(i.minimo)} min={0} maxFractionDigits={3} inputStyle={{ width: '6rem' }} onBlur={(e) => {
            const v = Number(String(e.target.value).replace(/\./g, '').replace(',', '.')) || 0
            if (v !== Number(i.minimo)) configurar(i, { minimo: v })
          }} />
          : numero(i.minimo))} />
        <Column header="Situação" body={situacao} />
        <Column header="" body={(i) => (
          <span className="tabela__acoes">
            {pode('ESTOQUE_ESCRITA') && <Button type="button" label="Lançar" icon="pi pi-plus" size="small" outlined
              onClick={() => { setLanc({ tipo: 'ENTRADA', quantidade: null, motivo: '' }); setLancando(i) }} />}
            <Button type="button" icon="pi pi-history" text rounded aria-label="Histórico" onClick={() => verHistorico(i)} />
            {pode('ESTOQUE_ALTERAR') && i.controla && <Button type="button" icon="pi pi-ban" text rounded severity="secondary" aria-label="Parar de controlar"
              onClick={() => configurar(i, { controla: false })} />}
          </span>
        )} />
      </DataTable>

      <Dialog header={lancando ? `Lançar em ${lancando.nome}` : ''} visible={!!lancando} onHide={() => setLancando(null)} style={{ width: 'min(28rem, 94vw)' }}
              footer={<Button type="button" label={salvando ? 'Salvando...' : 'Lançar'} disabled={salvando || lanc.quantidade === null} onClick={lancar} />}>
        <div className="estoque-lanc">
          <label htmlFor="est-tipo">Tipo</label>
          <Dropdown inputId="est-tipo" value={lanc.tipo} options={TIPOS} optionLabel="rotulo" optionValue="valor" onChange={(e) => setLanc({ ...lanc, tipo: e.value })} />
          <label htmlFor="est-qtd">{lanc.tipo === 'AJUSTE' ? 'Saldo contado' : 'Quantidade'} ({lancando?.unidade.toLowerCase()})</label>
          <InputNumber inputId="est-qtd" value={lanc.quantidade} min={0} maxFractionDigits={3} onValueChange={(e) => setLanc({ ...lanc, quantidade: e.value })} />
          <label htmlFor="est-motivo">Motivo (opcional)</label>
          <InputText id="est-motivo" maxLength={200} value={lanc.motivo} onChange={(e) => setLanc({ ...lanc, motivo: e.target.value })} />
        </div>
      </Dialog>

      <Dialog header={historico ? `Histórico de ${historico.ingrediente.nome}` : ''} visible={!!historico} onHide={() => setHistorico(null)} style={{ width: 'min(40rem, 96vw)' }}>
        <DataTable value={historico?.movimentos ?? []} emptyMessage="Sem movimentos" size="small">
          <Column header="Quando" body={(m) => new Date(m.dataHora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} />
          <Column header="Tipo" body={(m) => ROTULO_TIPO[m.tipo] ?? m.tipo} />
          <Column header="Qtd." body={(m) => `${m.quantidade > 0 ? '+' : ''}${numero(m.quantidade)}`} />
          <Column header="Saldo" body={(m) => numero(m.saldoApos)} />
          <Column header="Motivo" field="motivo" />
        </DataTable>
      </Dialog>
    </div>
  )
}
