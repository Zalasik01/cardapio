import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { buscarFuncionarios } from '../../api/funcionariosApi'
import TelaBusca from '../../components/crud/TelaBusca'
import { formatarCpf, formatarTelefone } from '../../utils/formatadores'

const FILTROS = [
  { nome: 'nome', rotulo: 'Nome', tipo: 'texto' },
  { nome: 'cpf', rotulo: 'CPF', tipo: 'texto' },
]

/** Lista separada por virgula, truncada com reticencias (o texto completo fica no title). */
function listaTruncada(itens) {
  if (!itens?.length) return '—'
  const texto = itens.join(', ')
  return <span className="celula-truncada" title={texto}>{texto}</span>
}

const COLUNAS = [
  { chave: 'nome', cabecalho: 'Nome' },
  { chave: 'cpf', cabecalho: 'CPF', render: (funcionario) => formatarCpf(funcionario.cpf) || '—' },
  { chave: 'apelido', cabecalho: 'Apelido', render: (funcionario) => funcionario.apelido || '—' },
  { chave: 'telefones', cabecalho: 'Telefones', render: (funcionario) => listaTruncada(funcionario.telefones?.map(formatarTelefone)) },
  { chave: 'emails', cabecalho: 'E-mails', render: (funcionario) => listaTruncada(funcionario.emails) },
]

export default function PaginaFuncionarios() {
  const { loja } = useAuth()
  const navigate = useNavigate()

  return (
    <TelaBusca
      titulo="Funcionários"
      chaveFiltros="funcionarios"
      placeholder="Buscar por nome, apelido ou CPF"
      colunas={COLUNAS}
      filtros={FILTROS}
      chaveLinha={(funcionario) => funcionario.id}
      buscar={({ busca, filtros, page, size }) => buscarFuncionarios(loja.tenant, { busca, ...filtros, page, size })}
      aoNovo={() => navigate('/admin/funcionarios/novo')}
      aoAbrir={(funcionario) => navigate(`/admin/funcionarios/${funcionario.id}`)}
    />
  )
}
