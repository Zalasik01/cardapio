import { useState } from 'react'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputMask } from 'primereact/inputmask'
import { InputText } from 'primereact/inputtext'
import { dispatchMsgWarn } from '../../store/dispatchMsg'
import { linkWhatsapp, soDigitos } from '../../utils/formatadores'
import { idLocal, REGEX_EMAIL, rotuloTipoTelefone, TIPOS_TELEFONE } from '../../utils/pessoa'
import { Campo, SecaoCrud } from './Campo'

/** Inclui ou substitui (quando já tem _id) uma linha da lista. */
function salvarLinha(lista, linha) {
  const existe = linha._id && lista.some((item) => item._id === linha._id)
  return existe
    ? lista.map((item) => (item._id === linha._id ? linha : item))
    : [...lista, { ...linha, _id: idLocal() }]
}

/**
 * Bloco "Contatos" dos cadastros (funcionário, cliente/fornecedor, loja...): tabelas de telefones e e-mails, com inclusão e
 * edição em modal (o cadastro não tem scroll lateral).
 *
 * Props: telefones, emails (linhas com _id) e aoAlterar('telefones' | 'emails', novaLista).
 */
export default function Contatos({ telefones, emails, aoAlterar }) {
  const [dialogoTelefone, setDialogoTelefone] = useState(null) // { _id?, tipo, numero, observacao }
  const [dialogoEmail, setDialogoEmail] = useState(null) // { _id?, email, observacao }

  function confirmarTelefone() {
    if (soDigitos(dialogoTelefone.numero).length < 10) {
      dispatchMsgWarn('Informe o número completo, com DDD.')
      return
    }
    aoAlterar('telefones', salvarLinha(telefones, dialogoTelefone))
    setDialogoTelefone(null)
  }

  function confirmarEmail() {
    if (!REGEX_EMAIL.test(dialogoEmail.email.trim())) {
      dispatchMsgWarn('Informe um e-mail válido.')
      return
    }
    aoAlterar('emails', salvarLinha(emails, { ...dialogoEmail, email: dialogoEmail.email.trim() }))
    setDialogoEmail(null)
  }

  /** Enter dentro do modal confirma (o modal não usa <form> para não disparar o envio do cadastro). */
  const aoTeclarDialogo = (confirmar) => (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      confirmar()
    }
  }

  return (
    <SecaoCrud id="secao-contatos" titulo="Contatos">
      <div className="contatos">
        <div className="contatos__lista">
          <DataTable value={telefones} dataKey="_id" emptyMessage="Nenhum telefone cadastrado." className="tabela-dados">
            <Column header="Tipo do telefone" body={(t) => rotuloTipoTelefone(t.tipo)} />
            <Column header="Número" body={(t) => (
              <span className="contato-numero">
                {t.numero}
                {t.tipo === 'CELULAR' && linkWhatsapp(t.numero) && (
                  <a className="contato-whatsapp" href={linkWhatsapp(t.numero)} target="_blank" rel="noopener noreferrer"
                     title="Abrir no WhatsApp" aria-label={`Abrir ${t.numero} no WhatsApp`}>
                    <i className="fa-brands fa-whatsapp" aria-hidden="true" />
                  </a>
                )}
              </span>
            )} />
            <Column header="Observação" field="observacao" />
            <Column style={{ width: '6.5rem', textAlign: 'right' }} body={(t) => (
              <span className="contato-acoes">
                <Button type="button" icon="pi pi-pencil" rounded text severity="secondary" aria-label="Editar telefone"
                        onClick={() => setDialogoTelefone({ ...t })} />
                <Button type="button" icon="pi pi-trash" rounded text severity="danger" aria-label="Remover telefone"
                        onClick={() => aoAlterar('telefones', telefones.filter((linha) => linha._id !== t._id))} />
              </span>
            )} />
          </DataTable>
          <Button type="button" label="Novo telefone" icon="pi pi-plus" size="small" outlined
                  onClick={() => setDialogoTelefone({ tipo: 'CELULAR', numero: '', observacao: '' })} />
        </div>

        <div className="contatos__lista">
          <DataTable value={emails} dataKey="_id" emptyMessage="Nenhum e-mail cadastrado." className="tabela-dados">
            <Column header="E-mail" field="email" />
            <Column header="Observação" field="observacao" />
            <Column style={{ width: '6.5rem', textAlign: 'right' }} body={(m) => (
              <span className="contato-acoes">
                <Button type="button" icon="pi pi-pencil" rounded text severity="secondary" aria-label="Editar e-mail"
                        onClick={() => setDialogoEmail({ ...m })} />
                <Button type="button" icon="pi pi-trash" rounded text severity="danger" aria-label="Remover e-mail"
                        onClick={() => aoAlterar('emails', emails.filter((linha) => linha._id !== m._id))} />
              </span>
            )} />
          </DataTable>
          <Button type="button" label="Novo e-mail" icon="pi pi-plus" size="small" outlined
                  onClick={() => setDialogoEmail({ email: '', observacao: '' })} />
        </div>
      </div>

      <Dialog
        header={dialogoTelefone?._id ? 'Editar telefone' : 'Novo telefone'}
        visible={!!dialogoTelefone}
        onHide={() => setDialogoTelefone(null)}
        style={{ width: 'min(28rem, 92vw)' }}
        footer={(
          <>
            <Button type="button" label="Cancelar" severity="secondary" outlined onClick={() => setDialogoTelefone(null)} />
            <Button type="button" label="Confirmar" onClick={confirmarTelefone} />
          </>
        )}
      >
        {dialogoTelefone && (
          <div className="dialogo-campos" onKeyDown={aoTeclarDialogo(confirmarTelefone)}>
            <Campo id="dlg-tipo" rotulo="Tipo do telefone" obrigatorio>
              <Dropdown inputId="dlg-tipo" value={dialogoTelefone.tipo} options={TIPOS_TELEFONE} optionLabel="rotulo"
                        optionValue="valor" onChange={(e) => setDialogoTelefone({ ...dialogoTelefone, tipo: e.value })} />
            </Campo>
            <Campo id="dlg-numero" rotulo="Número" obrigatorio
                   ajuda={dialogoTelefone.tipo === 'CELULAR' ? 'Celulares mostram um atalho para abrir o WhatsApp.' : undefined}>
              <InputMask key={dialogoTelefone.tipo} id="dlg-numero" autoFocus autoClear={false}
                         mask={dialogoTelefone.tipo === 'CELULAR' ? '(99) 99999-9999' : '(99) 9999-9999'}
                         value={dialogoTelefone.numero}
                         onChange={(e) => setDialogoTelefone({ ...dialogoTelefone, numero: e.target.value ?? '' })} />
            </Campo>
            <Campo id="dlg-obs-tel" rotulo="Observação">
              <InputText id="dlg-obs-tel" maxLength={255} value={dialogoTelefone.observacao}
                         onChange={(e) => setDialogoTelefone({ ...dialogoTelefone, observacao: e.target.value })} />
            </Campo>
          </div>
        )}
      </Dialog>

      <Dialog
        header={dialogoEmail?._id ? 'Editar e-mail' : 'Novo e-mail'}
        visible={!!dialogoEmail}
        onHide={() => setDialogoEmail(null)}
        style={{ width: 'min(28rem, 92vw)' }}
        footer={(
          <>
            <Button type="button" label="Cancelar" severity="secondary" outlined onClick={() => setDialogoEmail(null)} />
            <Button type="button" label="Confirmar" onClick={confirmarEmail} />
          </>
        )}
      >
        {dialogoEmail && (
          <div className="dialogo-campos" onKeyDown={aoTeclarDialogo(confirmarEmail)}>
            <Campo id="dlg-email" rotulo="E-mail" obrigatorio>
              <InputText id="dlg-email" type="email" autoFocus maxLength={255} value={dialogoEmail.email}
                         onChange={(e) => setDialogoEmail({ ...dialogoEmail, email: e.target.value })} />
            </Campo>
            <Campo id="dlg-obs-email" rotulo="Observação">
              <InputText id="dlg-obs-email" maxLength={255} value={dialogoEmail.observacao}
                         onChange={(e) => setDialogoEmail({ ...dialogoEmail, observacao: e.target.value })} />
            </Campo>
          </div>
        )}
      </Dialog>
    </SecaoCrud>
  )
}
