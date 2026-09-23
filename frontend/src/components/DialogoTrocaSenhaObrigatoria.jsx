import { useMemo, useState } from 'react'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { alterarMinhaSenha } from '../api/perfilApi'
import { useAuth } from '../context/AuthContext'
import { dispatchMsgError, dispatchMsgSuccess, dispatchMsgWarn } from '../store/dispatchMsg'
import { avaliarSenha } from '../utils/senha'
import CampoSenha from './CampoSenha'
import ForcaSenha from './ForcaSenha'

/**
 * Troca de senha obrigatoria, exibida enquanto o usuario estiver com senha temporaria (redefinida
 * por um administrador). Nao pode ser fechada: ou define a nova senha ou sai.
 */
export default function DialogoTrocaSenhaObrigatoria({ aoSair }) {
  const { usuarioLogado, atualizarUsuarioLogado } = useAuth()
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [salvando, setSalvando] = useState(false)

  const avaliacao = useMemo(
    () => avaliarSenha(novaSenha, { email: usuarioLogado?.email, nome: usuarioLogado?.nome }),
    [novaSenha, usuarioLogado?.email, usuarioLogado?.nome],
  )

  async function confirmar() {
    if (!avaliacao.forte) {
      dispatchMsgWarn('A nova senha ainda não cumpre todas as regras de segurança.')
      return
    }
    if (novaSenha !== confirmacao) {
      dispatchMsgWarn('A confirmação da senha não confere.')
      return
    }
    setSalvando(true)
    try {
      await alterarMinhaSenha(undefined, novaSenha)
      atualizarUsuarioLogado({ ...usuarioLogado, exigeTrocarSenha: false })
      dispatchMsgSuccess('Senha definida com sucesso')
    } catch (e) {
      dispatchMsgError(e.mensagem)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog
      visible
      modal
      closable={false}
      closeOnEscape={false}
      draggable={false}
      resizable={false}
      onHide={() => {}}
      header="Defina uma nova senha"
      style={{ width: 'min(30rem, 95vw)' }}
      footer={(
        <>
          <Button type="button" label="Sair" icon="pi pi-sign-out" severity="secondary" outlined onClick={aoSair} />
          <Button type="button" label={salvando ? 'Salvando...' : 'Definir senha'} disabled={salvando} onClick={confirmar} />
        </>
      )}
    >
      <div className="dialogo-campos" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), confirmar())}>
        <p className="dialogo-campos__texto">
          Você entrou com uma senha temporária. Crie uma nova senha para continuar usando o sistema.
        </p>
        <CampoSenha id="troca-nova-senha" rotulo="Nova senha" valor={novaSenha} aoAlterar={setNovaSenha}
                    autoComplete="new-password" aria-describedby="troca-regras-senha" />
        <ForcaSenha avaliacao={avaliacao} id="troca-regras-senha" />
        <CampoSenha id="troca-confirmacao" rotulo="Confirme a nova senha" valor={confirmacao}
                    aoAlterar={setConfirmacao} autoComplete="new-password" />
      </div>
    </Dialog>
  )
}
