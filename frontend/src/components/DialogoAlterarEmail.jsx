import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { alterarEmailUsuario } from '../api/usuariosApi'
import { useAuth } from '../context/AuthContext'
import { dispatchMsgError, dispatchMsgSuccess, dispatchMsgWarn } from '../store/dispatchMsg'

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Dialogo para alterar o e-mail de login de um usuario da loja. O e-mail so muda por aqui
 * ("..." da busca de usuarios ou "Mais opcoes" do cadastro).
 * usuario: { id, nome, email } | null (fechado). aoAlterado(usuarioAtualizado) roda apos gravar.
 */
export default function DialogoAlterarEmail({ usuario, aoFechar, aoAlterado }) {
  const { loja, usuarioLogado, sair } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (usuario) setEmail(usuario.email)
  }, [usuario])

  async function confirmar() {
    const novoEmail = email.trim()
    if (!REGEX_EMAIL.test(novoEmail)) {
      dispatchMsgWarn('Informe um e-mail válido.')
      return
    }
    if (novoEmail.toLowerCase() === usuario.email.toLowerCase()) {
      aoFechar()
      return
    }

    setSalvando(true)
    try {
      const atualizado = await alterarEmailUsuario(loja.tenant, usuario.id, novoEmail)
      dispatchMsgSuccess('E-mail alterado com sucesso')
      aoAlterado?.(atualizado)
      aoFechar()
      // o token da sessao identifica o usuario pelo e-mail: quem trocou o proprio precisa entrar de novo
      if (usuario.id === usuarioLogado?.id) {
        dispatchMsgWarn('Seu e-mail de acesso mudou. Entre novamente.')
        sair()
        navigate('/admin/login')
      }
    } catch (e) {
      dispatchMsgError(e.mensagem)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog
      header="Alterar e-mail"
      visible={!!usuario}
      onHide={aoFechar}
      style={{ width: 'min(28rem, 92vw)' }}
      footer={(
        <>
          <Button type="button" label="Cancelar" severity="secondary" outlined onClick={aoFechar} />
          <Button type="button" label={salvando ? 'Salvando...' : 'Confirmar'} disabled={salvando} onClick={confirmar} />
        </>
      )}
    >
      {usuario && (
        <div className="dialogo-campos" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), confirmar())}>
          <p className="texto-auxiliar dialogo-campos__texto">
            Usuário: <strong>{usuario.nome}</strong>. O e-mail é usado para entrar no sistema.
          </p>
          <div className="campo campo--12">
            <label htmlFor="novo-email">Novo e-mail <span className="campo__obrigatorio" aria-hidden="true">*</span></label>
            <InputText id="novo-email" type="email" autoFocus maxLength={255} value={email}
                       onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
      )}
    </Dialog>
  )
}
