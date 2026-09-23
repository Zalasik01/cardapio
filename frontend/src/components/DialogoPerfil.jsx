import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { FileUpload } from 'primereact/fileupload'
import { InputMask } from 'primereact/inputmask'
import { InputSwitch } from 'primereact/inputswitch'
import { InputText } from 'primereact/inputtext'
import {
  alterarMinhaSenha, atualizarPerfil, enviarMinhaFoto, obterMinhaFoto, removerMinhaFoto,
} from '../api/perfilApi'
import { useAuth } from '../context/AuthContext'
import { dispatchMsgError, dispatchMsgSuccess, dispatchMsgWarn } from '../store/dispatchMsg'
import { avaliarSenha } from '../utils/senha'
import { formatarTelefone } from '../utils/formatadores'
import CampoSenha from './CampoSenha'
import ForcaSenha from './ForcaSenha'

const TIPOS_FOTO = ['image/png', 'image/jpeg', 'image/webp']
const TAMANHO_MAXIMO_FOTO = 2 * 1024 * 1024

/** "Seu perfil": nome, WhatsApp, senha, configuracoes de tela e imagem do proprio usuario logado. */
export default function DialogoPerfil({ aberto, aoFechar }) {
  const { usuarioLogado, atualizarUsuarioLogado } = useAuth()
  const seletorArquivo = useRef(null)

  const [nome, setNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [alterarSenha, setAlterarSenha] = useState(false)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [arquivo, setArquivo] = useState(null)
  const [previa, setPrevia] = useState(null)
  const [tinhaFoto, setTinhaFoto] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // cada abertura recomeça dos dados atuais do usuario
  useEffect(() => {
    if (!aberto || !usuarioLogado) return undefined
    setNome(usuarioLogado.nome ?? '')
    setWhatsapp(formatarTelefone(usuarioLogado.whatsapp))
    setAlterarSenha(false)
    setSenhaAtual('')
    setNovaSenha('')
    setConfirmacao('')
    setArquivo(null)
    setPrevia(null)
    setTinhaFoto(!!usuarioLogado.temFoto)

    let cancelado = false
    let url = null
    if (usuarioLogado.temFoto) {
      obterMinhaFoto()
        .then((blob) => {
          if (cancelado) return
          url = URL.createObjectURL(blob)
          setPrevia(url)
        })
        .catch(() => {})
    }
    return () => {
      cancelado = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [aberto, usuarioLogado])

  const avaliacao = useMemo(
    () => avaliarSenha(novaSenha, { email: usuarioLogado?.email, nome }),
    [novaSenha, usuarioLogado?.email, nome],
  )

  function aoEscolherArquivo(evento) {
    const escolhido = evento.files?.[0]
    seletorArquivo.current?.clear() // a previa e desenhada por este dialogo, nao pela lista do FileUpload
    if (!escolhido) return
    if (!TIPOS_FOTO.includes(escolhido.type)) {
      dispatchMsgWarn('Formato de imagem não suportado. Use PNG, JPEG ou WEBP.')
      return
    }
    if (escolhido.size > TAMANHO_MAXIMO_FOTO) {
      dispatchMsgWarn('A imagem deve ter no máximo 2 MB.')
      return
    }
    setArquivo(escolhido)
    setPrevia(URL.createObjectURL(escolhido))
  }

  function removerImagem() {
    setArquivo(null)
    setPrevia(null)
  }

  async function confirmar() {
    if (!nome.trim()) {
      dispatchMsgWarn('Informe o seu nome.')
      return
    }
    if (alterarSenha) {
      if (!senhaAtual) {
        dispatchMsgWarn('Informe a senha atual.')
        return
      }
      if (!avaliacao.forte) {
        dispatchMsgWarn('A nova senha ainda não cumpre todas as regras de segurança.')
        return
      }
      if (novaSenha !== confirmacao) {
        dispatchMsgWarn('A confirmação da senha não confere.')
        return
      }
    }

    setSalvando(true)
    try {
      let atualizado = await atualizarPerfil({ nome: nome.trim(), whatsapp })
      if (alterarSenha) {
        await alterarMinhaSenha(senhaAtual, novaSenha)
      }
      if (arquivo) {
        await enviarMinhaFoto(arquivo)
        atualizado = { ...atualizado, temFoto: true }
      } else if (!previa && tinhaFoto) {
        await removerMinhaFoto()
        atualizado = { ...atualizado, temFoto: false }
      }
      atualizarUsuarioLogado(atualizado)
      dispatchMsgSuccess('Perfil atualizado com sucesso')
      aoFechar()
    } catch (e) {
      dispatchMsgError(e.mensagem)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog
      header="Seu perfil"
      visible={aberto}
      onHide={aoFechar}
      style={{ width: 'min(52rem, 96vw)' }}
      footer={<Button type="button" label={salvando ? 'Salvando...' : 'Confirmar'} disabled={salvando} onClick={confirmar} />}
    >
      <div className="perfil">
        <div className="perfil__coluna">
          <div className="campo campo--12">
            <label htmlFor="perfil-nome">Nome <span className="campo__obrigatorio" aria-hidden="true">*</span></label>
            <InputText id="perfil-nome" required maxLength={255} value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>

          <div className="campo campo--12">
            <label htmlFor="perfil-whatsapp">WhatsApp</label>
            <InputMask id="perfil-whatsapp" mask="(99) 99999-9999" autoClear={false} value={whatsapp}
                       onChange={(e) => setWhatsapp(e.target.value ?? '')} />
          </div>

          <div className="campo-checkbox perfil__linha">
            <label htmlFor="perfil-alterar-senha">Alterar senha</label>
            <InputSwitch inputId="perfil-alterar-senha" checked={alterarSenha} onChange={(e) => setAlterarSenha(e.value)} />
          </div>

          {alterarSenha && (
            <div className="perfil__senha">
              <CampoSenha id="perfil-senha-atual" rotulo="Senha atual" valor={senhaAtual} aoAlterar={setSenhaAtual} />
              <CampoSenha id="perfil-nova-senha" rotulo="Nova senha" valor={novaSenha} aoAlterar={setNovaSenha}
                          autoComplete="new-password" aria-describedby="perfil-regras-senha" />
              <ForcaSenha avaliacao={avaliacao} id="perfil-regras-senha" />
              <CampoSenha id="perfil-confirmacao" rotulo="Confirme a nova senha" valor={confirmacao}
                          aoAlterar={setConfirmacao} autoComplete="new-password" />
            </div>
          )}

        </div>

        <div className="perfil__coluna perfil__coluna--imagem">
          <span className="perfil__rotulo">Imagem do perfil</span>
          <FileUpload
            ref={seletorArquivo}
            name="foto"
            mode="advanced"
            customUpload
            multiple={false}
            chooseLabel="Escolher arquivo"
            chooseOptions={{ className: 'p-button-outlined p-button-secondary' }}
            onSelect={aoEscolherArquivo}
            className="perfil__upload"
            headerTemplate={({ chooseButton }) => <div className="perfil__upload-cabecalho">{chooseButton}</div>}
            itemTemplate={() => null}
            emptyTemplate={previa
              ? <img src={previa} alt="Imagem do perfil" className="perfil__previa" />
              : (
                <div className="perfil__vazio">
                  <i className="pi pi-upload" aria-hidden="true" />
                  <p>Arraste e solte um arquivo aqui</p>
                </div>
              )}
          />
          <Button type="button" label="Remover imagem" icon="pi pi-times" severity="danger" outlined size="small"
                  disabled={!previa} onClick={removerImagem} />
        </div>
      </div>
    </Dialog>
  )
}
