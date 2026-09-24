import { useCallback, useEffect, useState } from 'react'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { InputTextarea } from 'primereact/inputtextarea'
import {
  atualizarMensalidade, criarMensalidade, excluirMensalidade, listarMensalidades,
} from '../../api/gestaoLojasApi'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import { dataParaIso, formatarMoeda, isoParaData } from '../../utils/formatadores'
import { SITUACOES_MENSALIDADE } from '../../utils/loja'
import { Campo, GradeCampos, SecaoCrud } from '../crud/Campo'

const moeda = { mode: 'currency', currency: 'BRL', locale: 'pt-BR' }

const formatarData = (iso) => (iso ? isoParaData(iso).toLocaleDateString('pt-BR') : '—')
const formatarCompetencia = (iso) => {
  const data = isoParaData(iso)
  return `${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`
}

/** Selo da situação: pendente já vencida aparece como "Atrasada". */
function SeloSituacao({ mensalidade }) {
  if (mensalidade.atrasada) return <span className="selo selo--erro">Atrasada</span>
  const tom = { PAGA: 'sucesso', PENDENTE: 'alerta', CANCELADA: 'erro' }[mensalidade.situacao]
  const rotulo = SITUACOES_MENSALIDADE.find((s) => s.valor === mensalidade.situacao)?.rotulo
  return <span className={`selo selo--${tom}`}>{rotulo}</span>
}

/** Vencimento no dia configurado da loja, dentro do mês da competência. */
function vencimentoPadrao(competencia, diaVencimento) {
  return new Date(competencia.getFullYear(), competencia.getMonth(), diaVencimento || 10)
}

/**
 * Bloco "Mensalidades" da Gestão de Lojas: valor e dia de vencimento padrão da loja e o
 * histórico de lançamentos (incluir, editar, registrar pagamento e excluir, em modal).
 *
 * Props: lojaId (indefinido enquanto a loja não foi salva), valorMensalidade, diaVencimento e
 * aoAlterarConfig(campo, valor) para os dois campos padrão (gravados junto com a loja).
 */
export default function SecaoMensalidades({ lojaId, valorMensalidade, diaVencimento, aoAlterarConfig }) {
  const [mensalidades, setMensalidades] = useState(null)
  const [dialogo, setDialogo] = useState(null) // { id?, competencia, valor, dataVencimento, situacao, dataPagamento, observacao }
  const [salvando, setSalvando] = useState(false)

  const carregar = useCallback(() => {
    if (!lojaId) return
    listarMensalidades(lojaId)
      .then(setMensalidades)
      .catch((e) => dispatchMsgError(e.mensagem))
  }, [lojaId])

  useEffect(() => {
    carregar()
  }, [carregar])

  function nova() {
    // próxima competência depois da mais recente lançada (ou o mês atual, se ainda não há nenhuma)
    const ultima = mensalidades?.[0] ? isoParaData(mensalidades[0].competencia) : null
    const hoje = new Date()
    const competencia = ultima
      ? new Date(ultima.getFullYear(), ultima.getMonth() + 1, 1)
      : new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    setDialogo({
      competencia,
      valor: valorMensalidade ?? 0,
      dataVencimento: vencimentoPadrao(competencia, diaVencimento),
      situacao: 'PENDENTE',
      dataPagamento: null,
      observacao: '',
    })
  }

  function editar(m) {
    setDialogo({
      id: m.id,
      competencia: isoParaData(m.competencia),
      valor: m.valor,
      dataVencimento: isoParaData(m.dataVencimento),
      situacao: m.situacao,
      dataPagamento: isoParaData(m.dataPagamento),
      observacao: m.observacao ?? '',
    })
  }

  const dadosDaMensalidade = (d) => ({
    competencia: dataParaIso(d.competencia),
    valor: d.valor,
    dataVencimento: dataParaIso(d.dataVencimento),
    situacao: d.situacao,
    dataPagamento: d.situacao === 'PAGA' ? dataParaIso(d.dataPagamento) : null,
    observacao: d.observacao,
  })

  async function salvar() {
    if (!dialogo.competencia || !dialogo.dataVencimento || dialogo.valor == null) {
      dispatchMsgError('Informe a competência, o valor e o vencimento.')
      return
    }
    setSalvando(true)
    try {
      if (dialogo.id) {
        await atualizarMensalidade(lojaId, dialogo.id, dadosDaMensalidade(dialogo))
      } else {
        await criarMensalidade(lojaId, dadosDaMensalidade(dialogo))
      }
      dispatchMsgSuccess('Mensalidade salva com sucesso')
      setDialogo(null)
      carregar()
    } catch (e) {
      dispatchMsgError(e.mensagem)
    } finally {
      setSalvando(false)
    }
  }

  async function registrarPagamento(m) {
    try {
      await atualizarMensalidade(lojaId, m.id, {
        ...dadosDaMensalidade({
          ...m,
          competencia: isoParaData(m.competencia),
          dataVencimento: isoParaData(m.dataVencimento),
          situacao: 'PAGA',
          dataPagamento: new Date(),
        }),
      })
      dispatchMsgSuccess('Pagamento registrado')
      carregar()
    } catch (e) {
      dispatchMsgError(e.mensagem)
    }
  }

  function excluir(m) {
    confirmar({
      mensagem: `Excluir a mensalidade ${formatarCompetencia(m.competencia)}?`,
      aoConfirmar: async () => {
        try {
          await excluirMensalidade(lojaId, m.id)
          dispatchMsgSuccess('Mensalidade excluída com sucesso')
          carregar()
        } catch (e) {
          dispatchMsgError(e.mensagem)
        }
      },
    })
  }

  const definir = (campo) => (valor) => setDialogo((atual) => ({ ...atual, [campo]: valor }))

  return (
    <SecaoCrud id="secao-mensalidades" titulo="Mensalidades">
      <GradeCampos>
        <Campo id="valor-mensalidade" rotulo="Valor da mensalidade" tamanho={3}
               ajuda="Valor sugerido ao lançar uma nova mensalidade.">
          <InputNumber inputId="valor-mensalidade" value={valorMensalidade} min={0} {...moeda}
                       onValueChange={(e) => aoAlterarConfig('valorMensalidade', e.value ?? 0)} />
        </Campo>
        <Campo id="dia-vencimento" rotulo="Dia de vencimento" tamanho={3} ajuda="De 1 a 28.">
          <InputNumber inputId="dia-vencimento" value={diaVencimento} min={1} max={28} useGrouping={false}
                       onValueChange={(e) => aoAlterarConfig('diaVencimento', e.value)} />
        </Campo>
      </GradeCampos>

      {!lojaId ? (
        <p className="texto-auxiliar">Salve a loja para lançar as mensalidades.</p>
      ) : (
        <div className="contatos__lista">
          <DataTable value={mensalidades ?? []} dataKey="id" loading={mensalidades === null}
                     emptyMessage="Nenhuma mensalidade lançada." className="tabela-dados">
            <Column header="Competência" body={(m) => formatarCompetencia(m.competencia)} />
            <Column header="Vencimento" body={(m) => formatarData(m.dataVencimento)} />
            <Column header="Valor" body={(m) => formatarMoeda(m.valor)} />
            <Column header="Situação" body={(m) => <SeloSituacao mensalidade={m} />} />
            <Column header="Pago em" body={(m) => formatarData(m.dataPagamento)} />
            <Column style={{ width: '9rem', textAlign: 'right' }} body={(m) => (
              <span className="contato-acoes">
                {m.situacao === 'PENDENTE' && (
                  <Button type="button" icon="pi pi-check-circle" rounded text severity="success"
                          aria-label="Registrar pagamento" title="Registrar pagamento" onClick={() => registrarPagamento(m)} />
                )}
                <Button type="button" icon="pi pi-pencil" rounded text severity="secondary" aria-label="Editar mensalidade"
                        onClick={() => editar(m)} />
                <Button type="button" icon="pi pi-trash" rounded text severity="danger" aria-label="Excluir mensalidade"
                        onClick={() => excluir(m)} />
              </span>
            )} />
          </DataTable>
          <Button type="button" label="Nova mensalidade" icon="pi pi-plus" size="small" outlined onClick={nova} />
        </div>
      )}

      <Dialog
        header={dialogo?.id ? 'Editar mensalidade' : 'Nova mensalidade'}
        visible={!!dialogo}
        onHide={() => setDialogo(null)}
        style={{ width: 'min(30rem, 92vw)' }}
        footer={(
          <>
            <Button type="button" label="Cancelar" severity="secondary" outlined onClick={() => setDialogo(null)} />
            <Button type="button" label={salvando ? 'Salvando...' : 'Confirmar'} disabled={salvando} onClick={salvar} />
          </>
        )}
      >
        {dialogo && (
          <div className="dialogo-campos">
            <Campo id="dlg-competencia" rotulo="Competência (mês)" obrigatorio>
              <Calendar inputId="dlg-competencia" value={dialogo.competencia} view="month" dateFormat="mm/yy"
                        onChange={(e) => setDialogo((atual) => ({
                          ...atual,
                          competencia: e.value,
                          // ao trocar o mês de um lançamento novo, o vencimento acompanha o dia padrão
                          dataVencimento: atual.id || !e.value ? atual.dataVencimento : vencimentoPadrao(e.value, diaVencimento),
                        }))} />
            </Campo>
            <Campo id="dlg-valor" rotulo="Valor" obrigatorio>
              <InputNumber inputId="dlg-valor" value={dialogo.valor} min={0} {...moeda}
                           onValueChange={(e) => definir('valor')(e.value ?? 0)} />
            </Campo>
            <Campo id="dlg-vencimento" rotulo="Vencimento" obrigatorio>
              <Calendar inputId="dlg-vencimento" value={dialogo.dataVencimento} dateFormat="dd/mm/yy" mask="99/99/9999"
                        showIcon onChange={(e) => definir('dataVencimento')(e.value)} />
            </Campo>
            <Campo id="dlg-situacao" rotulo="Situação" obrigatorio>
              <Dropdown inputId="dlg-situacao" value={dialogo.situacao} options={SITUACOES_MENSALIDADE}
                        optionLabel="rotulo" optionValue="valor" onChange={(e) => definir('situacao')(e.value)} />
            </Campo>
            {dialogo.situacao === 'PAGA' && (
              <Campo id="dlg-pagamento" rotulo="Data do pagamento" ajuda="Se ficar em branco, vale hoje.">
                <Calendar inputId="dlg-pagamento" value={dialogo.dataPagamento} dateFormat="dd/mm/yy" mask="99/99/9999"
                          showIcon maxDate={new Date()} onChange={(e) => definir('dataPagamento')(e.value)} />
              </Campo>
            )}
            <Campo id="dlg-observacao" rotulo="Observação">
              <InputTextarea id="dlg-observacao" rows={3} maxLength={2000} autoResize value={dialogo.observacao}
                             onChange={(e) => definir('observacao')(e.target.value)} />
            </Campo>
          </div>
        )}
      </Dialog>
    </SecaoCrud>
  )
}
