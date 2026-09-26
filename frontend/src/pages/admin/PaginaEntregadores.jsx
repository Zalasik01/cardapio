import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { alterarAtivoEntregador, buscarEntregadores, excluirEntregador } from '../../api/entregadoresApi'
import TelaBusca from '../../components/crud/TelaBusca'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import { formatarMoeda, formatarTelefone } from '../../utils/formatadores'

const TIPOS = { PROPRIO: 'Próprio', TERCEIRIZADO: 'Terceirizado' }

const COLUNAS = [
  { chave: 'nome', cabecalho: 'Nome' },
  { chave: 'tipo', cabecalho: 'Tipo', render: (e) => TIPOS[e.tipo] ?? e.tipo },
  { chave: 'telefone', cabecalho: 'Telefone', render: (e) => (e.telefone ? formatarTelefone(e.telefone) : '—') },
  { chave: 'veiculo', cabecalho: 'Veículo', render: (e) => e.veiculo || '—' },
  { chave: 'repasse', cabecalho: 'Repasse por entrega', render: (e) => formatarMoeda(e.repassePorEntrega) },
]

/** Entrega > Entregadores: quem faz as entregas (próprios e terceirizados) e quanto recebe por entrega. */
export default function PaginaEntregadores() {
  const { loja, pode } = useAuth()
  const navigate = useNavigate()
  const [versao, setVersao] = useState(0)

  function alterarAtivo(entregador, ativo) {
    const executar = async () => {
      try {
        await alterarAtivoEntregador(loja.tenant, entregador.id, ativo)
        dispatchMsgSuccess(ativo ? 'Entregador ativado com sucesso' : 'Entregador inativado com sucesso')
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
      mensagem: `Inativar "${entregador.nome}"? O link do celular dele deixa de funcionar até ser ativado novamente.`,
      rotuloConfirmar: 'Inativar',
      aoConfirmar: executar,
    })
  }

  function excluir(entregador) {
    confirmar({
      mensagem: `Excluir "${entregador.nome}"? Essa ação não pode ser desfeita.`,
      rotuloConfirmar: 'Excluir',
      aoConfirmar: async () => {
        try {
          await excluirEntregador(loja.tenant, entregador.id)
          dispatchMsgSuccess('Entregador excluído com sucesso')
          setVersao((atual) => atual + 1)
        } catch (e) {
          dispatchMsgError(e.mensagem)
        }
      },
    })
  }

  return (
    <TelaBusca
      titulo="Entregadores"
      chaveFiltros="entregadores"
      placeholder="Buscar por nome"
      colunas={COLUNAS}
      chaveLinha={(entregador) => entregador.id}
      buscar={({ busca, filtros, page, size }) => buscarEntregadores(loja.tenant, { busca, ...filtros, page, size })}
      aoNovo={pode('ENTREGADORES_INCLUIR') ? () => navigate('/admin/entregadores/novo') : undefined}
      aoAbrir={(entregador) => navigate(`/admin/entregadores/${entregador.id}`)}
      rotuloNovo="Novo entregador"
      chaveAtualizacao={versao}
      acoesExtras={(entregador) => [
        ...(pode('ENTREGADORES_INATIVAR') ? [entregador.ativo
          ? { label: 'Inativar', icon: 'pi pi-ban', command: () => alterarAtivo(entregador, false) }
          : { label: 'Ativar', icon: 'pi pi-check-circle', command: () => alterarAtivo(entregador, true) }] : []),
        ...(pode('ENTREGADORES_EXCLUIR') ? [{ label: 'Excluir', icon: 'pi pi-trash', command: () => excluir(entregador) }] : []),
      ]}
    />
  )
}
