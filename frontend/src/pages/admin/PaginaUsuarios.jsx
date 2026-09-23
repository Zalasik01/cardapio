import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { alterarAtivoUsuario, buscarUsuarios } from '../../api/usuariosApi'
import TelaBusca from '../../components/crud/TelaBusca'
import DialogoAlterarEmail from '../../components/DialogoAlterarEmail'
import DialogoRedefinirSenha from '../../components/DialogoRedefinirSenha'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import { STATUS_USUARIO } from './statusUsuario'

const FILTROS = [
  { nome: 'nome', rotulo: 'Nome', tipo: 'texto' },
  { nome: 'email', rotulo: 'E-mail', tipo: 'texto' },
  {
    nome: 'ativo',
    rotulo: 'Usuário ativo',
    tipo: 'selecao',
    opcoes: [{ valor: 'true', rotulo: 'Ativo' }, { valor: 'false', rotulo: 'Inativo' }],
  },
  {
    nome: 'status',
    rotulo: 'Situação do acesso',
    tipo: 'selecao',
    opcoes: Object.entries(STATUS_USUARIO).map(([valor, { rotulo }]) => ({ valor, rotulo })),
  },
]

function formatarData(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

const COLUNAS = [
  { chave: 'ativo', cabecalho: 'Ativo', render: (usuario) => (usuario.ativo ? 'Sim' : 'Não') },
  {
    chave: 'status',
    cabecalho: 'Acesso',
    render: (usuario) => {
      const status = STATUS_USUARIO[usuario.status]
      return <span className={`selo selo--${status.tom}`}>{status.rotulo}</span>
    },
  },
  { chave: 'nome', cabecalho: 'Nome' },
  { chave: 'email', cabecalho: 'E-mail' },
  { chave: 'funcionarioNome', cabecalho: 'Funcionário', render: (usuario) => usuario.funcionarioNome || '—' },
  { chave: 'dataUltimoAcesso', cabecalho: 'Último acesso', render: (usuario) => formatarData(usuario.dataUltimoAcesso) },
]

export default function PaginaUsuarios() {
  const { loja } = useAuth()
  const navigate = useNavigate()
  const [usuarioEmail, setUsuarioEmail] = useState(null)
  const [usuarioSenha, setUsuarioSenha] = useState(null)
  const [versao, setVersao] = useState(0)

  function alterarAtivo(usuario, ativo) {
    const executar = async () => {
      try {
        await alterarAtivoUsuario(loja.tenant, usuario.id, ativo)
        dispatchMsgSuccess(ativo ? 'Usuário ativado com sucesso' : 'Usuário inativado com sucesso')
        setVersao((atual) => atual + 1)
      } catch (e) {
        dispatchMsgError(e.mensagem)
      }
    }
    if (ativo) {
      executar()
      return
    }
    confirmar({
      mensagem: `Inativar ${usuario.nome}? Ele deixa de acessar esta loja até ser ativado novamente.`,
      rotuloConfirmar: 'Inativar',
      aoConfirmar: executar,
    })
  }

  return (
    <>
    <TelaBusca
      titulo="Usuários"
      placeholder="Buscar por nome ou e-mail"
      colunas={COLUNAS}
      filtros={FILTROS}
      chaveLinha={(usuario) => usuario.id}
      buscar={({ busca, filtros, page, size }) => buscarUsuarios(loja.tenant, { busca, ...filtros, page, size })}
      aoNovo={() => navigate('/admin/usuarios/novo')}
      aoAbrir={(usuario) => navigate(`/admin/usuarios/${usuario.id}`)}
      chaveAtualizacao={versao}
      acoesExtras={(usuario) => [
        { label: 'Alterar e-mail', icon: 'pi pi-envelope', command: () => setUsuarioEmail(usuario) },
        usuario.ativo
          ? { label: 'Inativar usuário', icon: 'pi pi-ban', command: () => alterarAtivo(usuario, false) }
          : { label: 'Ativar usuário', icon: 'pi pi-check-circle', command: () => alterarAtivo(usuario, true) },
        // quem ainda nao definiu a senha usa o link de acesso (dentro do cadastro)
        ...(usuario.status !== 'PENDENTE'
          ? [{ label: 'Redefinir senha', icon: 'pi pi-key', command: () => setUsuarioSenha(usuario) }]
          : []),
      ]}
    />
    <DialogoAlterarEmail
      usuario={usuarioEmail}
      aoFechar={() => setUsuarioEmail(null)}
      aoAlterado={() => setVersao((atual) => atual + 1)}
    />
    <DialogoRedefinirSenha
      usuario={usuarioSenha}
      aoFechar={() => setUsuarioSenha(null)}
      aoRedefinida={() => setVersao((atual) => atual + 1)}
    />
    </>
  )
}
