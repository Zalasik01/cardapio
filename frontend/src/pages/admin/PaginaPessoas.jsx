import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { buscarPessoas } from '../../api/pessoasApi'
import TelaBusca from '../../components/crud/TelaBusca'
import { formatarCnpj, formatarCpf, formatarTelefone } from '../../utils/formatadores'

const FILTROS = [
  { nome: 'nome', rotulo: 'Nome / razão social', tipo: 'texto' },
  { nome: 'documento', rotulo: 'CPF / CNPJ', tipo: 'texto' },
  {
    nome: 'tipo',
    rotulo: 'Tipo de pessoa',
    tipo: 'selecao',
    opcoes: [{ valor: 'FISICA', rotulo: 'Física' }, { valor: 'JURIDICA', rotulo: 'Jurídica' }],
  },
  {
    nome: 'papel',
    rotulo: 'Cadastrado como',
    tipo: 'selecao',
    opcoes: [{ valor: 'CLIENTE', rotulo: 'Cliente' }, { valor: 'FORNECEDOR', rotulo: 'Fornecedor' }],
  },
]

/** Lista separada por vírgula, truncada com reticências (o texto completo fica no title). */
function listaTruncada(itens) {
  if (!itens?.length) return '—'
  const texto = itens.join(', ')
  return <span className="celula-truncada" title={texto}>{texto}</span>
}

const documentoFormatado = (pessoa) =>
  (pessoa.tipo === 'FISICA' ? formatarCpf(pessoa.documento) : formatarCnpj(pessoa.documento)) || '—'

const COLUNAS = [
  { chave: 'nome', cabecalho: 'Nome / razão social' },
  { chave: 'tipo', cabecalho: 'Tipo', render: (pessoa) => (pessoa.tipo === 'FISICA' ? 'Física' : 'Jurídica') },
  { chave: 'documento', cabecalho: 'CPF / CNPJ', render: documentoFormatado },
  { chave: 'apelidoOuFantasia', cabecalho: 'Apelido / fantasia', render: (pessoa) => pessoa.apelidoOuFantasia || '—' },
  {
    chave: 'papel',
    cabecalho: 'Cadastrado como',
    render: (pessoa) => [pessoa.cliente && 'Cliente', pessoa.fornecedor && 'Fornecedor'].filter(Boolean).join(', '),
  },
  { chave: 'telefones', cabecalho: 'Telefones', render: (pessoa) => listaTruncada(pessoa.telefones?.map(formatarTelefone)) },
  { chave: 'emails', cabecalho: 'E-mails', render: (pessoa) => listaTruncada(pessoa.emails) },
]

export default function PaginaPessoas() {
  const { loja, pode } = useAuth()
  const navigate = useNavigate()

  return (
    <TelaBusca
      titulo="Clientes e Fornecedores"
      chaveFiltros="pessoas"
      placeholder="Buscar por nome, apelido, fantasia ou CPF/CNPJ"
      colunas={COLUNAS}
      filtros={FILTROS}
      chaveLinha={(pessoa) => pessoa.id}
      buscar={({ busca, filtros, page, size }) => buscarPessoas(loja.tenant, { busca, ...filtros, page, size })}
      aoNovo={pode('CLIENTES_FORNECEDORES_INCLUIR') ? () => navigate('/admin/pessoas/novo') : undefined}
      aoAbrir={(pessoa) => navigate(`/admin/pessoas/${pessoa.id}`)}
    />
  )
}
