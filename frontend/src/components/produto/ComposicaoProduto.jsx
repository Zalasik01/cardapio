import { useState } from 'react'
import { AutoComplete } from 'primereact/autocomplete'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Dialog } from 'primereact/dialog'
import { InputNumber } from 'primereact/inputnumber'
import { buscarProdutosCadastro } from '../../api/produtosCadastroApi'
import { useAuth } from '../../context/AuthContext'
import { dispatchMsgWarn } from '../../store/dispatchMsg'
import { formatarMoeda } from '../../utils/formatadores'
import { custoDaComposicao, siglaUnidade } from '../../utils/produto'
import { Campo, SecaoCrud } from '../crud/Campo'

const moedaFina = (valor) => Number(valor).toLocaleString('pt-BR', {
  style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 4,
})

let proximoIdLocal = 0

/**
 * Bloco "Composição" do produto final (ficha técnica): ingredientes e quantidades, com o custo estimado
 * e a margem sobre o preço de venda. Incluir e editar acontece em modal.
 *
 * Props: itens [{ _id, ingredienteId, ingredienteNome, unidadeMedida, quantidade, custoUnitario }],
 * preco (de venda, para a margem) e aoAlterar(novosItens).
 */
export default function ComposicaoProduto({ itens, preco, aoAlterar }) {
  const { loja } = useAuth()
  const [dialogo, setDialogo] = useState(null) // { _id?, ingrediente (objeto | texto), quantidade }
  const [sugestoes, setSugestoes] = useState([])

  const custo = custoDaComposicao(itens)
  const margem = preco > 0 ? ((preco - custo) / preco) * 100 : null

  function buscarIngredientes(evento) {
    buscarProdutosCadastro(loja.tenant, { tipo: 'INGREDIENTE', busca: evento.query, size: 10 })
      .then((resposta) => setSugestoes(resposta.content))
      .catch(() => setSugestoes([]))
  }

  function confirmar() {
    const ingrediente = dialogo.ingrediente
    if (!ingrediente?.id) {
      dispatchMsgWarn('Selecione um ingrediente da lista.')
      return
    }
    if (!(dialogo.quantidade > 0)) {
      dispatchMsgWarn('Informe a quantidade.')
      return
    }
    if (itens.some((item) => item.ingredienteId === ingrediente.id && item._id !== dialogo._id)) {
      dispatchMsgWarn('Este ingrediente já está na composição. Edite a quantidade dele.')
      return
    }
    const item = {
      _id: dialogo._id ?? `item-${++proximoIdLocal}`,
      ingredienteId: ingrediente.id,
      ingredienteNome: ingrediente.nome,
      unidadeMedida: ingrediente.unidadeMedida,
      quantidade: dialogo.quantidade,
      custoUnitario: ingrediente.custoUnitario,
    }
    aoAlterar(dialogo._id ? itens.map((atual) => (atual._id === dialogo._id ? item : atual)) : [...itens, item])
    setDialogo(null)
  }

  return (
    <SecaoCrud id="secao-composicao" titulo="Composição">
      <div className="contatos__lista">
        <DataTable value={itens} dataKey="_id" emptyMessage="Nenhum ingrediente na composição." className="tabela-dados">
          <Column header="Ingrediente" field="ingredienteNome" />
          <Column header="Quantidade" body={(item) => `${Number(item.quantidade).toLocaleString('pt-BR')} ${siglaUnidade(item.unidadeMedida)}`} />
          <Column header="Custo por unidade" body={(item) => moedaFina(item.custoUnitario)} />
          <Column header="Custo" body={(item) => formatarMoeda(item.quantidade * item.custoUnitario)} />
          <Column style={{ width: '6.5rem', textAlign: 'right' }} body={(item) => (
            <span className="contato-acoes">
              <Button type="button" icon="pi pi-pencil" rounded text severity="secondary" aria-label="Editar item"
                      onClick={() => setDialogo({
                        _id: item._id,
                        ingrediente: { id: item.ingredienteId, nome: item.ingredienteNome, unidadeMedida: item.unidadeMedida, custoUnitario: item.custoUnitario },
                        quantidade: item.quantidade,
                      })} />
              <Button type="button" icon="pi pi-trash" rounded text severity="danger" aria-label="Remover item"
                      onClick={() => aoAlterar(itens.filter((atual) => atual._id !== item._id))} />
            </span>
          )} />
        </DataTable>
        <Button type="button" label="Novo ingrediente" icon="pi pi-plus" size="small" outlined
                onClick={() => setDialogo({ ingrediente: null, quantidade: null })} />
      </div>

      <p className="composicao__resumo">
        Custo estimado: <strong>{formatarMoeda(custo)}</strong>
        {margem !== null && <> · Margem sobre o preço: <strong>{margem.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</strong></>}
      </p>

      <Dialog
        header={dialogo?._id ? 'Editar ingrediente' : 'Novo ingrediente'}
        visible={!!dialogo}
        onHide={() => setDialogo(null)}
        style={{ width: 'min(28rem, 92vw)' }}
        footer={(
          <>
            <Button type="button" label="Cancelar" severity="secondary" outlined onClick={() => setDialogo(null)} />
            <Button type="button" label="Confirmar" onClick={confirmar} />
          </>
        )}
      >
        {dialogo && (
          <div className="dialogo-campos" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), confirmar())}>
            <Campo id="dlg-ingrediente" rotulo="Ingrediente" obrigatorio>
              <AutoComplete
                inputId="dlg-ingrediente"
                value={dialogo.ingrediente}
                suggestions={sugestoes}
                completeMethod={buscarIngredientes}
                field="nome"
                dropdown
                forceSelection
                delay={300}
                autoFocus
                placeholder="Digite para buscar"
                itemTemplate={(item) => <span>{item.nome} <small className="campo__ajuda">· {siglaUnidade(item.unidadeMedida)}</small></span>}
                onChange={(e) => setDialogo({ ...dialogo, ingrediente: e.value })}
              />
            </Campo>
            <Campo id="dlg-quantidade" rotulo={`Quantidade${dialogo.ingrediente?.unidadeMedida ? ` (${siglaUnidade(dialogo.ingrediente.unidadeMedida)})` : ''}`} obrigatorio>
              <InputNumber inputId="dlg-quantidade" value={dialogo.quantidade} min={0} minFractionDigits={0} maxFractionDigits={3}
                           onValueChange={(e) => setDialogo({ ...dialogo, quantidade: e.value })} />
            </Campo>
          </div>
        )}
      </Dialog>
    </SecaoCrud>
  )
}
