import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { alterarAtivoFormaPagamento, buscarFormasPagamento, excluirFormaPagamento } from '../../api/formasPagamentoApi'
import TelaBusca from '../../components/crud/TelaBusca'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import { formatarMoeda } from '../../utils/formatadores'
import { rotuloTipoPagamento } from '../../utils/pagamento'

const COLUNAS = [
  { chave: 'nome', cabecalho: 'Nome' },
  { chave: 'tipo', cabecalho: 'Tipo', render: (forma) => rotuloTipoPagamento(forma.tipo) },
  {
    chave: 'taxa',
    cabecalho: 'Taxa',
    render: (forma) => {
      const partes = []
      if (Number(forma.taxaPercentual) > 0) partes.push(`${String(forma.taxaPercentual).replace('.', ',')}%`)
      if (Number(forma.taxaFixa) > 0) partes.push(formatarMoeda(forma.taxaFixa))
      return partes.length ? partes.join(' + ') : 'Sem taxa'
    },
  },
  {
    chave: 'valeEm',
    cabecalho: 'Vale para',
    render: (forma) => [forma.aceitaEntrega && 'Entrega', forma.aceitaRetirada && 'Retirada'].filter(Boolean).join(' e '),
  },
]

/** Geral > Formas de pagamento: como a loja recebe, com taxa e regras de uso de cada forma. */
export default function PaginaFormasPagamento() {
  const { loja, pode } = useAuth()
  const navigate = useNavigate()
  const [versao, setVersao] = useState(0) // muda para recarregar a lista depois de inativar/excluir

  function alterarAtivo(forma, ativo) {
    const executar = async () => {
      try {
        await alterarAtivoFormaPagamento(loja.tenant, forma.id, ativo)
        dispatchMsgSuccess(ativo ? 'Forma de pagamento ativada com sucesso' : 'Forma de pagamento inativada com sucesso')
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
      mensagem: `Inativar a forma de pagamento "${forma.nome}"? Ela deixa de aparecer nos pedidos até ser ativada novamente.`,
      rotuloConfirmar: 'Inativar',
      aoConfirmar: executar,
    })
  }

  function excluir(forma) {
    confirmar({
      mensagem: `Excluir a forma de pagamento "${forma.nome}"? Essa ação não pode ser desfeita.`,
      rotuloConfirmar: 'Excluir',
      aoConfirmar: async () => {
        try {
          await excluirFormaPagamento(loja.tenant, forma.id)
          dispatchMsgSuccess('Forma de pagamento excluída com sucesso')
          setVersao((atual) => atual + 1)
        } catch (e) {
          dispatchMsgError(e.mensagem)
        }
      },
    })
  }

  return (
    <TelaBusca
      titulo="Formas de pagamento"
      chaveFiltros="formas-pagamento"
      placeholder="Buscar por nome"
      colunas={COLUNAS}
      chaveLinha={(forma) => forma.id}
      buscar={({ busca, filtros, page, size }) => buscarFormasPagamento(loja.tenant, { busca, ...filtros, page, size })}
      aoNovo={pode('FORMAS_PAGAMENTO_INCLUIR') ? () => navigate('/admin/formas-pagamento/novo') : undefined}
      aoAbrir={(forma) => navigate(`/admin/formas-pagamento/${forma.id}`)}
      rotuloNovo="Nova forma de pagamento"
      chaveAtualizacao={versao}
      acoesExtras={(forma) => [
        ...(pode('FORMAS_PAGAMENTO_INATIVAR') ? [forma.ativo
          ? { label: 'Inativar', icon: 'pi pi-ban', command: () => alterarAtivo(forma, false) }
          : { label: 'Ativar', icon: 'pi pi-check-circle', command: () => alterarAtivo(forma, true) }] : []),
        ...(pode('FORMAS_PAGAMENTO_EXCLUIR') ? [{ label: 'Excluir', icon: 'pi pi-trash', command: () => excluir(forma) }] : []),
      ]}
    />
  )
}
