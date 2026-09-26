import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { ENDERECO_VAZIO, idLocal } from '../../utils/pessoa'
import { Campo, GradeCampos, SecaoCrud } from './Campo'
import Endereco from './Endereco'

/**
 * "Outros endereços" do cliente (casa, trabalho...): além do principal, quantos precisar. Cada um tem um nome, os campos
 * de endereço (com busca por CEP) e as ações "Tornar principal" e "Remover".
 * Props: lista (endereços adicionais), aoAlterar(novaLista), aoTornarPrincipal(indice), somenteLeitura.
 */
export default function EnderecosAdicionais({ lista, aoAlterar, aoTornarPrincipal, somenteLeitura = false }) {
  const alterar = (indice, campos) => aoAlterar(lista.map((e, i) => (i === indice
    ? { ...e, ...(typeof campos === 'function' ? campos(e) : campos) } : e)))

  return (
    <SecaoCrud id="secao-outros-enderecos" titulo="Outros endereços">
      {lista.length === 0 && <p className="texto-auxiliar">Nenhum outro endereço. Adicione o da casa, do trabalho ou de onde o cliente costuma pedir.</p>}
      {lista.map((e, i) => (
        <fieldset key={e._id} className="endereco-adicional">
          <div className="endereco-adicional__topo">
            <GradeCampos>
              <Campo id={`apelido-${e._id}`} rotulo="Nome do endereço" tamanho={4} ajuda="Ex.: Casa, Trabalho.">
                <InputText id={`apelido-${e._id}`} maxLength={40} value={e.apelido ?? ''} disabled={somenteLeitura}
                           onChange={(ev) => alterar(i, { apelido: ev.target.value })} />
              </Campo>
            </GradeCampos>
            {!somenteLeitura && (
              <span className="endereco-adicional__acoes">
                <Button type="button" label="Tornar principal" icon="pi pi-star" severity="secondary" outlined size="small" onClick={() => aoTornarPrincipal(i)} />
                <Button type="button" label="Remover" icon="pi pi-trash" severity="danger" outlined size="small" onClick={() => aoAlterar(lista.filter((_, j) => j !== i))} />
              </span>
            )}
          </div>
          <Endereco endereco={e} aoAlterar={(campos) => alterar(i, campos)} prefixo={`${e._id}-`} semSecao />
        </fieldset>
      ))}
      {!somenteLeitura && (
        <Button type="button" label="Adicionar endereço" icon="pi pi-plus" outlined
                onClick={() => aoAlterar([...lista, { ...ENDERECO_VAZIO, apelido: '', _id: idLocal() }])} />
      )}
    </SecaoCrud>
  )
}
