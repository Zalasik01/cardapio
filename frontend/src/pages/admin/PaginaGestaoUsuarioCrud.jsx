import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { Checkbox } from 'primereact/checkbox'
import { InputText } from 'primereact/inputtext'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import {
  alterarEmailUsuarioInterno, atualizarUsuarioInterno, criarUsuarioInterno, excluirUsuarioInterno,
  gerarNovoLinkUsuarioInterno, obterUsuarioInterno, redefinirSenhaUsuarioInterno,
} from '../../api/gestaoUsuariosApi'
import CrudPagina from '../../components/crud/CrudPagina'
import CampoAtivo from '../../components/crud/CampoAtivo'
import RodapeCrud from '../../components/crud/RodapeCrud'
import { Campo, GradeCampos, SecaoCrud } from '../../components/crud/Campo'
import DialogoAlterarEmail from '../../components/DialogoAlterarEmail'
import DialogoLinkAcesso from '../../components/DialogoLinkAcesso'
import DialogoRedefinirSenha from '../../components/DialogoRedefinirSenha'
import { FormularioSkeleton } from '../../components/Skeleton'

const ROTA_LISTA = '/admin/gestao-usuarios'

/** Cadastro de usuário interno: /admin/gestao-usuarios/novo e /admin/gestao-usuarios/:id. */
export default function PaginaGestaoUsuarioCrud() {
  const { id } = useParams()
  const editando = id !== undefined
  const navigate = useNavigate()
  const { definirMigalha } = useOutletContext()

  const [form, setForm] = useState({ nome: '', email: '', ativo: true, administrador: false, pendente: false })
  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)
  const [convite, setConvite] = useState(null) // { token, expiraEm, nome }
  const [alterandoEmail, setAlterandoEmail] = useState(false)
  const [redefinindoSenha, setRedefinindoSenha] = useState(false)

  useEffect(() => {
    definirMigalha(editando ? 'Editando usuário interno' : 'Novo usuário interno')
    return () => definirMigalha(null)
  }, [editando, definirMigalha])

  useEffect(() => {
    if (!editando) return
    setCarregando(true)
    obterUsuarioInterno(id)
      .then((usuario) => setForm({
        nome: usuario.nome, email: usuario.email, ativo: usuario.ativo,
        administrador: usuario.administrador, pendente: usuario.pendente,
      }))
      .catch((e) => dispatchMsgError(e.mensagem))
      .finally(() => setCarregando(false))
  }, [editando, id])

  const definir = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSalvando(true)
    const dados = { nome: form.nome, email: form.email, administrador: form.administrador, ativo: form.ativo }
    try {
      if (editando) {
        await atualizarUsuarioInterno(id, dados)
        dispatchMsgSuccess('Usuário atualizado com sucesso')
      } else {
        const resposta = await criarUsuarioInterno(dados)
        dispatchMsgSuccess('Usuário cadastrado com sucesso')
        setConvite({ token: resposta.token, expiraEm: resposta.expiraEm, nome: resposta.usuario.nome })
      }
    } catch (e2) {
      dispatchMsgError(e2.mensagem)
    } finally {
      setSalvando(false)
    }
  }

  function handleExcluir() {
    confirmar({
      mensagem: 'Excluir este usuário interno?',
      aoConfirmar: async () => {
        try {
          await excluirUsuarioInterno(id)
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
      const resposta = await gerarNovoLinkUsuarioInterno(id)
      setConvite({ token: resposta.token, expiraEm: resposta.expiraEm, nome: resposta.usuario.nome })
    } catch (e) {
      dispatchMsgError(e.mensagem)
    }
  }

  function fecharConvite() {
    setConvite(null)
    if (!editando) navigate(ROTA_LISTA)
  }

  // "Mais opções" do cadastro (só na edição)
  const itensMaisOpcoes = [
    { label: 'Alterar e-mail', icon: 'pi pi-envelope', command: () => setAlterandoEmail(true) },
    form.pendente
      ? { label: 'Gerar novo link de acesso', icon: 'pi pi-link', command: handleNovoLink }
      : { label: 'Redefinir senha', icon: 'pi pi-key', command: () => setRedefinindoSenha(true) },
  ]

  const conteudo = (
    <SecaoCrud id="secao-principal" titulo="Dados básicos">
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

        <div className="campo campo--6">
          <fieldset className="fieldset-crud">
            <legend>Configurações adicionais</legend>
            <span className="campo-checkbox">
              <Checkbox inputId="administrador" checked={form.administrador}
                        onChange={(e) => definir('administrador')(e.checked)} />
              <label htmlFor="administrador">Administrador da plataforma</label>
            </span>
            <small className="campo__ajuda">
              Acessa a Gestão Interna (lojas e usuários internos). Todo usuário interno enxerga todas as lojas.
            </small>
          </fieldset>
        </div>
      </GradeCampos>
    </SecaoCrud>
  )

  return (
    <form onSubmit={handleSubmit}>
      <CrudPagina
        titulo={editando ? (carregando ? 'Usuário interno' : form.nome) : 'Novo usuário interno'}
        subtitulo={editando ? 'Editar usuário interno' : 'Cadastro de usuário interno'}
        aoVoltar={() => navigate(ROTA_LISTA)}
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
      >
        {carregando ? <FormularioSkeleton campos={4} /> : conteudo}
      </CrudPagina>

      <DialogoAlterarEmail
        usuario={alterandoEmail ? { id: Number(id), nome: form.nome, email: form.email } : null}
        salvar={alterarEmailUsuarioInterno}
        aoFechar={() => setAlterandoEmail(false)}
        aoAlterado={(atualizado) => setForm((atual) => ({ ...atual, email: atualizado.email }))}
      />
      <DialogoRedefinirSenha
        usuario={redefinindoSenha ? { id: Number(id), nome: form.nome } : null}
        salvar={redefinirSenhaUsuarioInterno}
        aoFechar={() => setRedefinindoSenha(false)}
      />
      <DialogoLinkAcesso convite={convite} aoFechar={fecharConvite} />
    </form>
  )
}
