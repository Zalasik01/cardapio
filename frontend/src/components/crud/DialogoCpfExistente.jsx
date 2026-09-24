import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'

function papeis(existente) {
  return [
    existente.funcionarioId && 'funcionário',
    existente.cliente && 'cliente',
    existente.fornecedor && 'fornecedor',
  ].filter(Boolean).join(', ')
}

/**
 * Aviso mostrado quando o CPF digitado já pertence a uma pessoa da loja. A pessoa é a mesma nos
 * cadastros de funcionário e de cliente/fornecedor: os dados dela são carregados no formulário
 * e o que for salvo reflete em todos.
 *
 * Props:
 *  - existente: resposta de consultarPessoaPorCpf
 *  - jaPossuiCadastro: a pessoa já tem o cadastro que está sendo criado (então só dá para abri-lo)
 *  - aoUsar(): carrega os dados no formulário; aoAbrir(): abre o cadastro existente; aoCancelar(): limpa o CPF
 */
export default function DialogoCpfExistente({ existente, jaPossuiCadastro, aoUsar, aoAbrir, aoCancelar }) {
  return (
    <Dialog
      header="CPF já cadastrado"
      visible={!!existente}
      onHide={aoCancelar}
      style={{ width: 'min(30rem, 92vw)' }}
      footer={(
        <>
          <Button type="button" label="Cancelar" severity="secondary" outlined onClick={aoCancelar} />
          {jaPossuiCadastro
            ? <Button type="button" label="Abrir cadastro" onClick={aoAbrir} />
            : <Button type="button" label="Usar este cadastro" onClick={aoUsar} />}
        </>
      )}
    >
      {existente && (
        <div className="dialogo-campos">
          <p className="dialogo-campos__texto">
            Encontramos um cadastro com este CPF: <strong>{existente.nome}</strong> ({papeis(existente)}).
          </p>
          {jaPossuiCadastro ? (
            <p className="dialogo-campos__texto">
              Essa pessoa já está cadastrada aqui. Abra o cadastro existente para alterá-lo.
            </p>
          ) : (
            <p className="dialogo-campos__texto">
              Os dados dele serão carregados neste formulário. Como é a mesma pessoa, ao salvar as
              alterações serão refletidas nos dois cadastros.
            </p>
          )}
        </div>
      )}
    </Dialog>
  )
}
