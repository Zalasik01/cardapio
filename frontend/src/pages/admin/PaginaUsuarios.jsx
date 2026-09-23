import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { buscarUsuarios } from '../../api/usuariosApi'
import TelaBusca from '../../components/crud/TelaBusca'
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
  { chave: 'nome', cabecalho: 'Nome' },
  { chave: 'email', cabecalho: 'E-mail' },
  { chave: 'funcionarioNome', cabecalho: 'Funcionário', render: (usuario) => usuario.funcionarioNome || '—' },
  { chave: 'administrador', cabecalho: 'Administrador', render: (usuario) => (usuario.administrador ? 'Sim' : 'Não') },
  {
    chave: 'status',
    cabecalho: 'Acesso',
    render: (usuario) => {
      const status = STATUS_USUARIO[usuario.status]
      return <span className={`selo selo--${status.tom}`}>{status.rotulo}</span>
    },
  },
  {
    chave: 'ativo',
    cabecalho: 'Ativo',
    render: (usuario) => (usuario.ativo ? 'Sim' : 'Não'),
  },
  { chave: 'dataUltimoAcesso', cabecalho: 'Último acesso', render: (usuario) => formatarData(usuario.dataUltimoAcesso) },
]

export default function PaginaUsuarios() {
  const { loja } = useAuth()
  const navigate = useNavigate()

  return (
    <TelaBusca
      titulo="Usuários"
      placeholder="Buscar por nome ou e-mail"
      colunas={COLUNAS}
      filtros={FILTROS}
      chaveLinha={(usuario) => usuario.guid}
      buscar={({ busca, filtros, page, size }) => buscarUsuarios(loja.tenant, { busca, ...filtros, page, size })}
      aoNovo={() => navigate('/admin/usuarios/novo')}
      aoAbrir={(usuario) => navigate(`/admin/usuarios/${usuario.guid}`)}
    />
  )
}
