import { useEffect, useState } from 'react'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { redefinirSenhaUsuario } from '../api/usuariosApi'
import { useAuth } from '../context/AuthContext'
import { dispatchMsgError, dispatchMsgSuccess } from '../store/dispatchMsg'
import { gerarSenhaTemporaria } from '../utils/senha'

/**
 * Redefinir a senha de um usuario da loja: mostra uma senha temporaria; ao confirmar ela passa a
 * valer e o usuario e obrigado a criar uma nova no proximo acesso.
 * usuario: { id, nome } | null (fechado).
 * salvar(id, senha): grava a senha; o padrao redefine a de um usuario da loja da sessao.
 */
export default function DialogoRedefinirSenha({ usuario, aoFechar, aoRedefinida, salvar }) {
  const { loja } = useAuth()
  const [senha, setSenha] = useState('')
  const [copiada, setCopiada] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (usuario) {
      setSenha(gerarSenhaTemporaria())
      setCopiada(false)
    }
  }, [usuario])

  function gerarOutra() {
    setSenha(gerarSenhaTemporaria())
    setCopiada(false)
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(senha)
      setCopiada(true)
    } catch {
      dispatchMsgError('Não foi possível copiar. Selecione a senha e copie manualmente.')
    }
  }

  async function confirmar() {
    setSalvando(true)
    try {
      await (salvar ?? ((id, valor) => redefinirSenhaUsuario(loja.tenant, id, valor)))(usuario.id, senha)
      dispatchMsgSuccess('Senha redefinida. O usuário deverá criar uma nova senha no próximo acesso.')
      aoRedefinida?.()
      aoFechar()
    } catch (e) {
      dispatchMsgError(e.mensagem)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog
      header="Redefinir senha"
      visible={!!usuario}
      onHide={aoFechar}
      style={{ width: 'min(30rem, 92vw)' }}
      footer={(
        <>
          <Button type="button" label="Cancelar" severity="secondary" outlined onClick={aoFechar} />
          <Button type="button" label={salvando ? 'Salvando...' : 'Confirmar'} disabled={salvando} onClick={confirmar} />
        </>
      )}
    >
      {usuario && (
        <div className="dialogo-campos">
          <p className="dialogo-campos__texto">
            Foi gerada uma senha temporária para <strong>{usuario.nome}</strong>. Copie e informe ao usuário
            <strong> antes de confirmar</strong>: no próximo acesso ele será obrigado a criar uma nova senha.
          </p>
          <div className="campo campo--12">
            <label htmlFor="senha-temporaria">Senha temporária</label>
            <div className="convite__link">
              <InputText id="senha-temporaria" readOnly value={senha} onFocus={(e) => e.target.select()} />
              <Button type="button" icon={copiada ? 'pi pi-check' : 'pi pi-copy'} severity="secondary" outlined
                      aria-label="Copiar senha" title="Copiar" onClick={copiar} />
              <Button type="button" icon="pi pi-refresh" severity="secondary" outlined
                      aria-label="Gerar outra senha" title="Gerar outra" onClick={gerarOutra} />
            </div>
          </div>
        </div>
      )}
    </Dialog>
  )
}
