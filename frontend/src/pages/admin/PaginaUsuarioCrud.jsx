import { useEffect, useRef, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { AutoComplete } from 'primereact/autocomplete'
import { Button } from 'primereact/button'
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
import CrudBlocos from '../../components/crud/CrudBlocos'
import { Campo, GradeCampos } from '../../components/crud/Campo'
import { FormularioSkeleton } from '../../components/Skeleton'
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
  const [copiado, setCopiado] = useState(false)

  // foto: arquivo escolhido (a enviar), previa exibida e se a foto atual deve ser removida
  const [arquivoFoto, setArquivoFoto] = useState(null)
  const [previaFoto, setPreviaFoto] = useState(null)
  const [tinhaFoto, setTinhaFoto] = useState(false)
  const [removerFoto, setRemoverFoto] = useState(false)
  const inputArquivo = useRef(null)

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
          exigeTrocarSenha: usuario.exigeTrocarSenha,
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
    const arquivo = e.target.files?.[0]
    e.target.value = '' // permite escolher o mesmo arquivo de novo
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

  const link = convite ? `${window.location.origin}/novo-usuario/${convite.token}` : ''

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(link)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      dispatchMsgError('Não foi possível copiar. Selecione o link e copie manualmente.')
    }
  }

  function fecharConvite() {
    setConvite(null)
    if (!editando) navigate(ROTA_LISTA)
  }

  const dadosBasicos = (
    <GradeCampos>
      {editando && (
        <div className="campo campo--12 campo--linha">
          <span className="campo-checkbox">
            <Checkbox inputId="ativo" checked={form.ativo} onChange={(e) => definir('ativo')(e.checked)} />
            <label htmlFor="ativo">Ativo</label>
          </span>
        </div>
      )}

      <Campo id="nome" rotulo="Nome" obrigatorio tamanho={6}>
        <InputText id="nome" required maxLength={255} value={form.nome} onChange={(e) => definir('nome')(e.target.value)} />
      </Campo>
      <Campo id="email" rotulo="E-mail" obrigatorio tamanho={6}
             ajuda={editando ? 'O e-mail não pode ser alterado depois do cadastro.' : undefined}>
        <InputText id="email" type="email" required maxLength={255} readOnly={editando} value={form.email}
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
              <input ref={inputArquivo} type="file" accept={TIPOS_FOTO.join(',')} className="sr-only"
                     aria-label="Escolher arquivo de imagem" onChange={escolherArquivo} />
              <Button type="button" label="Escolher arquivo" icon="pi pi-upload" outlined
                      onClick={() => inputArquivo.current.click()} />
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
          <>
            <div className="crud__acoes">
              {editando && (
                <Button type="button" label="Excluir" icon="pi pi-trash" severity="danger" outlined
                        disabled={carregando} onClick={handleExcluir} />
              )}
              {editando && form.exigeTrocarSenha && (
                <Button type="button" label="Gerar novo link" icon="pi pi-link" severity="secondary" outlined
                        onClick={handleNovoLink} />
              )}
              <span className="crud__espaco" />
              <Button type="button" label="Fechar" severity="secondary" outlined onClick={() => navigate(ROTA_LISTA)} />
              <Button type="submit" label={salvando ? 'Salvando...' : 'Salvar alterações'} disabled={salvando || carregando} />
            </div>
          </>
        )}
      />

      {convite && (
        <div className="modal-fundo">
          <div className="painel-selecao" role="dialog" aria-modal="true" aria-labelledby="titulo-convite">
            <header className="painel-selecao__cabecalho">
              <div>
                <h1 id="titulo-convite">Link de acesso</h1>
                <p>
                  Envie este link para <strong>{convite.nome}</strong> definir a senha. Ele vale até{' '}
                  {new Date(convite.expiraEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} e só
                  pode ser usado uma vez.
                </p>
              </div>
            </header>
            <div className="convite__link">
              <InputText readOnly value={link} aria-label="Link de acesso" onFocus={(e) => e.target.select()} />
              <Button type="button" label={copiado ? 'Copiado' : 'Copiar'} icon={copiado ? 'pi pi-check' : 'pi pi-copy'}
                      onClick={copiarLink} />
            </div>
            <Button type="button" label="Concluir" severity="secondary" outlined className="painel-selecao__sair"
                    onClick={fecharConvite} />
          </div>
        </div>
      )}
    </form>
  )
}
