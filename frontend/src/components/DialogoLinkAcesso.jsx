import { useEffect, useState } from 'react'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { dispatchMsgError } from '../store/dispatchMsg'

/**
 * Link /novo-usuario/{token} para o usuário convidado definir a senha (o link vale uma vez só).
 * convite: { token, expiraEm, nome } | null (fechado).
 */
export default function DialogoLinkAcesso({ convite, aoFechar }) {
  const [copiado, setCopiado] = useState(false)
  const link = convite ? `${window.location.origin}/novo-usuario/${convite.token}` : ''

  useEffect(() => {
    if (convite) setCopiado(false)
  }, [convite])

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      dispatchMsgError('Não foi possível copiar. Selecione o link e copie manualmente.')
    }
  }

  return (
    <Dialog
      header="Link de acesso"
      visible={!!convite}
      onHide={aoFechar}
      style={{ width: 'min(32rem, 95vw)' }}
      footer={<Button type="button" label="Concluir" severity="secondary" outlined onClick={aoFechar} />}
    >
      {convite && (
        <div className="dialogo-campos">
          <p className="dialogo-campos__texto">
            Envie este link para <strong>{convite.nome}</strong> definir a senha. Ele vale até{' '}
            {new Date(convite.expiraEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} e só
            pode ser usado uma vez.
          </p>
          <div className="convite__link">
            <InputText readOnly value={link} aria-label="Link de acesso" onFocus={(e) => e.target.select()} />
            <Button type="button" label={copiado ? 'Copiado' : 'Copiar'} icon={copiado ? 'pi pi-check' : 'pi pi-copy'}
                    onClick={copiar} />
          </div>
        </div>
      )}
    </Dialog>
  )
}
