import { confirmDialog } from 'primereact/confirmdialog'

/**
 * Pede confirmacao ao usuario em um dialogo do sistema (nunca window.confirm).
 * aoConfirmar so roda se o usuario confirmar.
 */
export function confirmar({ mensagem, aoConfirmar, titulo = 'Confirmação', rotuloConfirmar = 'Confirmar', perigo = true }) {
  confirmDialog({
    header: titulo,
    message: mensagem,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: rotuloConfirmar,
    rejectLabel: 'Cancelar',
    acceptClassName: perigo ? 'p-button-danger' : undefined,
    defaultFocus: 'reject',
    accept: aoConfirmar,
  })
}
