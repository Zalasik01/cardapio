import { useNavigate } from 'react-router-dom'
import { buscarLojasGestao } from '../../api/gestaoLojasApi'
import TelaBusca from '../../components/crud/TelaBusca'
import { formatarTelefone } from '../../utils/formatadores'
import { rotuloSituacaoConta, rotuloTipoOrganizacao, SITUACOES_CONTA, TIPOS_ORGANIZACAO } from '../../utils/loja'

const FILTROS = [
  { nome: 'situacaoConta', rotulo: 'Situação da conta', tipo: 'selecao', opcoes: SITUACOES_CONTA },
  { nome: 'tipoOrganizacao', rotulo: 'Tipo de organização', tipo: 'selecao', opcoes: TIPOS_ORGANIZACAO },
]

const COLUNAS = [
  { chave: 'id', cabecalho: 'Código' },
  { chave: 'nome', cabecalho: 'Nome' },
  { chave: 'slug', cabecalho: 'Endereço (slug)' },
  { chave: 'tipoOrganizacao', cabecalho: 'Tipo', render: (loja) => rotuloTipoOrganizacao(loja.tipoOrganizacao) },
  { chave: 'situacaoConta', cabecalho: 'Situação', render: (loja) => rotuloSituacaoConta(loja.situacaoConta) },
  {
    chave: 'cidade',
    cabecalho: 'Cidade',
    render: (loja) => [loja.cidade, loja.estado].filter(Boolean).join(' / ') || '—',
  },
  { chave: 'telefone', cabecalho: 'Telefone', render: (loja) => (loja.telefone ? formatarTelefone(loja.telefone) : '—') },
]

/** Gestão Interna > Gestão de Lojas: lojas da plataforma (somente usuário administrador). */
export default function PaginaGestaoLojas() {
  const navigate = useNavigate()

  return (
    <TelaBusca
      titulo="Gestão de Lojas"
      chaveFiltros="gestao-lojas"
      placeholder="Buscar por nome ou endereço (slug)"
      colunas={COLUNAS}
      filtros={FILTROS}
      chaveLinha={(loja) => loja.id}
      buscar={({ busca, filtros, page, size }) => buscarLojasGestao({ busca, ...filtros, page, size })}
      aoNovo={() => navigate('/admin/gestao-lojas/novo')}
      aoAbrir={(loja) => navigate(`/admin/gestao-lojas/${loja.id}`)}
      rotuloNovo="Nova loja"
    />
  )
}
