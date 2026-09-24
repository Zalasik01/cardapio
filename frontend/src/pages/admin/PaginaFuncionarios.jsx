import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { buscarFuncionarios } from '../../api/funcionariosApi'
import TelaBusca from '../../components/crud/TelaBusca'
import { formatarCpf } from '../../utils/formatadores'

const FILTROS = [
  { nome: 'nome', rotulo: 'Nome', tipo: 'texto' },
  { nome: 'cpf', rotulo: 'CPF', tipo: 'texto' },
]

const COLUNAS = [
  { chave: 'nome', cabecalho: 'Nome' },
  { chave: 'apelido', cabecalho: 'Apelido', render: (funcionario) => funcionario.apelido || '—' },
  { chave: 'cpf', cabecalho: 'CPF', render: (funcionario) => formatarCpf(funcionario.cpf) || '—' },
  { chave: 'ativo', cabecalho: 'Ativo', render: (funcionario) => (funcionario.ativo ? 'Sim' : 'Não') },
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
