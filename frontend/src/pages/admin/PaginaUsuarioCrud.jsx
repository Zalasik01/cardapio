import { useEffect, useRef, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { AutoComplete } from 'primereact/autocomplete'
import { Button } from 'primereact/button'
import { FileUpload } from 'primereact/fileupload'
import { Checkbox } from 'primereact/checkbox'
import { InputText } from 'primereact/inputtext'
import { useAuth } from '../../context/AuthContext'
import { dispatchMsgError, dispatchMsgSuccess, dispatchMsgWarn } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import {
  atualizarUsuario, criarUsuario, enviarFotoUsuario, excluirUsuario, gerarNovoLinkUsuario, obterFotoUsuario,
  obterUsuario, removerFotoUsuario,
} from '../../api/usuariosApi'
import { buscarFuncionarios } from '../../api/funcionariosApi'
import CampoAtivo from '../../components/crud/CampoAtivo'
import CrudBlocos from '../../components/crud/CrudBlocos'
import RodapeCrud from '../../components/crud/RodapeCrud'
import { Campo, GradeCampos } from '../../components/crud/Campo'
import { FormularioSkeleton } from '../../components/Skeleton'
import DialogoAlterarEmail from '../../components/DialogoAlterarEmail'
import DialogoLinkAcesso from '../../components/DialogoLinkAcesso'
import DialogoRedefinirSenha from '../../components/DialogoRedefinirSenha'
import { formatarCpf } from '../../utils/formatadores'

const ROTA_LISTA = '/admin/usuarios'
const TIPOS_FOTO = ['image/png', 'image/jpeg', 'image/webp']
const TAMANHO_MAXIMO_FOTO = 2 * 1024 * 1024

/** CRUD de usuario da loja: /admin/usuarios/novo (cria) e /admin/usuarios/:id (edita). */
export default function PaginaUsuarioCrud() {
  const { id } = useParams()
  const editando = id !== undefined
  const { loja } = useAuth()
  const navigate = useNavigate()
  const { definirMigalha } = useOutletContext()

  const [form, setForm] = useState({ nome: '', email: '', ativo: true, administrador: false, exigeTrocarSenha: false })
  const [funcionario, setFuncionario] = useState(null) // objeto { id, nome, cpf } ou o texto digitado
  const [sugestoes, setSugestoes] = useState([])
  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)
  const [convite, setConvite] = useState(null) // { token, expiraEm, nome }

  // foto: arquivo escolhido (a enviar), previa exibida e se a foto atual deve ser removida
  const [arquivoFoto, setArquivoFoto] = useState(null)
  const [previaFoto, setPreviaFoto] = useState(null)
  const [tinhaFoto, setTinhaFoto] = useState(false)
  const [removerFoto, setRemoverFoto] = useState(false)
  const seletorFoto = useRef(null)
  const [alterandoEmail, setAlterandoEmail] = useState(false)
  const [redefinindoSenha, setRedefinindoSenha] = useState(false)

  useEffect(() => {
    definirMigalha(editando ? 'Editando usuário' : 'Novo usuário')
    return () => definirMigalha(null)
  }, [editando, definirMigalha])

  useEffect(() => {
    if (!editando) return
    setCarregando(true)
    obterUsuario(loja.tenant, id)
      .then(async (usuario) => {
        setForm({
          nome: usuario.nome, email: usuario.email, ativo: usuario.ativo, administrador: usuario.administrador,
          exigeTrocarSenha: usuario.exigeTrocarSenha, status: usuario.status,
        })
        setFuncionario(usuario.funcionarioId ? { id: usuario.funcionarioId, nome: usuario.funcionarioNome } : null)
        setTinhaFoto(usuario.temFoto)
        if (usuario.temFoto) {
          const blob = await obterFotoUsuario(loja.tenant, id)
          setPreviaFoto(URL.createObjectURL(blob))
        }
      })
      .catch((e) => dispatchMsgError(e.mensagem))
      .finally(() => setCarregando(false))
  }, [editando, id, loja.tenant])

  // libera a URL temporaria da previa quando ela muda ou a tela fecha
  useEffect(() => () => {
    if (previaFoto) URL.revokeObjectURL(previaFoto)
  }, [previaFoto])

  const definir = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }))

  function buscarSugestoes(evento) {
    buscarFuncionarios(loja.tenant, { busca: evento.query, ativo: true, size: 10 })
      .then((resposta) => setSugestoes(resposta.content))
      .catch(() => setSugestoes([]))
  }

  function escolherArquivo(e) {
    const arquivo = e.files?.[0]
    seletorFoto.current?.clear() // a previa e desenhada aqui, nao pela lista do FileUpload
    if (!arquivo) return
    if (!TIPOS_FOTO.includes(arquivo.type)) {
      dispatchMsgWarn('Formato de imagem não suportado. Use PNG, JPEG ou WEBP.')
      return
    }
    if (arquivo.size > TAMANHO_MAXIMO_FOTO) {
      dispatchMsgWarn('A imagem deve ter no máximo 2 MB.')
      return
    }
    setArquivoFoto(arquivo)
    setRemoverFoto(false)
    setPreviaFoto(URL.createObjectURL(arquivo))
  }

  function handleRemoverFoto() {
    setArquivoFoto(null)
    setPreviaFoto(null)
    setRemoverFoto(tinhaFoto)
  }

  async function sincronizarFoto(usuarioId) {
    if (arquivoFoto) {
      await enviarFotoUsuario(loja.tenant, usuarioId, arquivoFoto)
    } else if (removerFoto) {
      await removerFotoUsuario(loja.tenant, usuarioId)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!funcionario?.id) {
      dispatchMsgWarn('Selecione um funcionário da lista.')
      return
    }

    setSalvando(true)
    const dados = {
      nome: form.nome, email: form.email, funcionarioId: funcionario.id, ativo: form.ativo,
      administrador: form.administrador,
    }
    try {
      if (editando) {
        await atualizarUsuario(loja.tenant, id, dados)
        await sincronizarFoto(id)
        setArquivoFoto(null)
        setTinhaFoto(!!previaFoto)
        setRemoverFoto(false)
        dispatchMsgSuccess('Usuário atualizado com sucesso')
      } else {
        const resposta = await criarUsuario(loja.tenant, dados)
        dispatchMsgSuccess('Usuário cadastrado com sucesso')
        try {
          await sincronizarFoto(resposta.usuario.id)
        } catch (erroFoto) {
          dispatchMsgWarn(`Usuário criado, mas a foto não foi enviada: ${erroFoto.mensagem}`)
        }
        if (resposta.token) {
          setConvite({ token: resposta.token, expiraEm: resposta.expiraEm, nome: resposta.usuario.nome })
        } else {
          navigate(ROTA_LISTA) // usuario que ja tinha senha: vinculado direto, sem link
        }
      }
    } catch (e2) {
      dispatchMsgError(e2.mensagem)
    } finally {
      setSalvando(false)
    }
  }

  function handleExcluir() {
    confirmar({
      mensagem: 'Excluir este usuário da loja? A conta dele em outras lojas não é afetada.',
      aoConfirmar: async () => {
        try {
          await excluirUsuario(loja.tenant, id)
          dispatchMsgSuccess('Usuário excluído com sucesso')
          navigate(ROTA_LISTA)
        } catch (e) {
          dispatchMsgError(e.mensagem)
        }
      },
    })
  }

  async function handleNovoLink() {
    try {
      const resposta = await gerarNovoLinkUsuario(loja.tenant, id)
      setConvite({ token: resposta.token, expiraEm: resposta.expiraEm, nome: resposta.usuario.nome })
    } catch (e) {
      dispatchMsgError(e.mensagem)
    }
  }

  function fecharConvite() {
    setConvite(null)
    if (!editando) navigate(ROTA_LISTA)
  }

  // "Mais opcoes" do cadastro (so na edicao)
  const pendente = form.status === 'PENDENTE' // ainda nao definiu a senha: usa o link de acesso
  const itensMaisOpcoes = [
    { label: 'Alterar e-mail', icon: 'pi pi-envelope', command: () => setAlterandoEmail(true) },
    pendente
      ? { label: 'Gerar novo link de acesso', icon: 'pi pi-link', command: handleNovoLink }
      : { label: 'Redefinir senha', icon: 'pi pi-key', command: () => setRedefinindoSenha(true) },
  ]

  const dadosBasicos = (
    <GradeCampos>
      {editando && <CampoAtivo valor={form.ativo} aoAlterar={definir('ativo')} />}

      <Campo id="nome" rotulo="Nome" obrigatorio tamanho={6}>
        <InputText id="nome" required maxLength={255} value={form.nome} onChange={(e) => definir('nome')(e.target.value)} />
      </Campo>
      <Campo id="email" rotulo="E-mail" obrigatorio tamanho={6}
             ajuda={editando ? 'Para alterar o e-mail, use "Mais opções" (seta ao lado de Fechar).' : undefined}>
        <InputText id="email" type="email" required maxLength={255} disabled={editando} value={form.email}
                   onChange={(e) => definir('email')(e.target.value)} />
      </Campo>

      <Campo id="funcionario" rotulo="Funcionário" obrigatorio tamanho={6}>
        <AutoComplete
          inputId="funcionario"
          value={funcionario}
          suggestions={sugestoes}
          completeMethod={buscarSugestoes}
          field="nome"
          dropdown
          forceSelection
          delay={300}
          placeholder="Digite para buscar"
          disabled={editando}
          itemTemplate={(item) => (
            <span>{item.nome}{item.cpf && <small className="campo__ajuda"> · {formatarCpf(item.cpf)}</small>}</span>
          )}
          onChange={(e) => setFuncionario(e.value)}
        />
      </Campo>

      <div className="campo campo--6">
        <fieldset className="fieldset-crud">
          <legend>Configurações adicionais</legend>
          <span className="campo-checkbox">
            <Checkbox inputId="administrador" checked={form.administrador}
                      onChange={(e) => definir('administrador')(e.checked)} />
            <label htmlFor="administrador">Administrador</label>
          </span>
          <small className="campo__ajuda">Acesso a todas as telas e opções desta loja.</small>
        </fieldset>
      </div>

      <div className="campo campo--12">
        <fieldset className="fieldset-crud">
          <legend>Foto do usuário</legend>
          <div className="foto-usuario">
            <div className="foto-usuario__acoes">
              <FileUpload
                ref={seletorFoto}
                mode="basic"
                name="foto"
                customUpload
                auto={false}
                chooseLabel="Escolher arquivo"
                chooseOptions={{ icon: 'pi pi-upload', className: 'p-button-outlined' }}
                onSelect={escolherArquivo}
              />
              <small className="campo__ajuda">PNG, JPEG ou WEBP de até 2 MB.</small>
            </div>
            <div className="foto-usuario__previa" aria-live="polite">
              {previaFoto ? <img src={previaFoto} alt="Foto do usuário" /> : <span>Selecione uma imagem</span>}
            </div>
            <Button type="button" label="Remover" icon="pi pi-times" severity="danger" outlined
                    disabled={!previaFoto} onClick={handleRemoverFoto} />
          </div>
        </fieldset>
      </div>
    </GradeCampos>
  )

  const permissoes = (
    <div className="crud__aviso">
      <i className="fa-solid fa-circle-info" aria-hidden="true" /> As permissões do usuário (acesso, leitura e escrita por
      tela) serão configuradas aqui em uma próxima etapa. Enquanto isso, usuários marcados como <strong>Administrador</strong>{' '}
      têm acesso a tudo na loja.
    </div>
  )

  return (
    <form onSubmit={handleSubmit}>
      <CrudBlocos
        titulo={editando ? (carregando ? 'Usuário' : form.nome) : 'Novo usuário'}
        subtitulo={editando ? 'Editar usuário' : 'Cadastro de usuário'}
        aoVoltar={() => navigate(ROTA_LISTA)}
        carregando={carregando}
        esqueleto={<FormularioSkeleton campos={4} />}
        blocos={[
          { id: 'basicos', titulo: 'Dados básicos', conteudo: dadosBasicos },
          { id: 'permissoes', titulo: 'Permissões do usuário', conteudo: permissoes },
        ]}
        rodape={(
          <RodapeCrud
            editando={editando}
            carregando={carregando}
            salvando={salvando}
            aoExcluir={handleExcluir}
            aoFechar={() => navigate(ROTA_LISTA)}
            maisOpcoes={itensMaisOpcoes}
          />
        )}
      />

      <DialogoAlterarEmail
        usuario={alterandoEmail ? { id: Number(id), nome: form.nome, email: form.email } : null}
        aoFechar={() => setAlterandoEmail(false)}
        aoAlterado={(atualizado) => setForm((atual) => ({ ...atual, email: atualizado.email }))}
      />

      <DialogoRedefinirSenha
        usuario={redefinindoSenha ? { id: Number(id), nome: form.nome } : null}
        aoFechar={() => setRedefinindoSenha(false)}
      />

      <DialogoLinkAcesso convite={convite} aoFechar={fecharConvite} />
    </form>
  )
}
