import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { alterarAtivoZona, buscarZonas, excluirZona } from '../../api/zonasApi'
import TelaBusca from '../../components/crud/TelaBusca'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import { formatarMoeda } from '../../utils/formatadores'

const COLUNAS = [
  { chave: 'bairro', cabecalho: 'Bairro' },
  { chave: 'taxa', cabecalho: 'Taxa de entrega', render: (zona) => formatarMoeda(zona.taxa) },
  { chave: 'tempoEstimadoMinutos', cabecalho: 'Tempo estimado', render: (zona) => `${zona.tempoEstimadoMinutos} min` },
]

/** Entrega > Zonas de entrega: a taxa e o tempo estimado de cada bairro atendido. */
export default function PaginaZonasEntrega() {
  const { loja, pode } = useAuth()
  const navigate = useNavigate()
  const [versao, setVersao] = useState(0) // muda para recarregar a lista depois de inativar/excluir

  function alterarAtivo(zona, ativo) {
    const executar = async () => {
      try {
        await alterarAtivoZona(loja.tenant, zona.id, ativo)
        dispatchMsgSuccess(ativo ? 'Zona ativada com sucesso' : 'Zona inativada com sucesso')
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
      mensagem: `Inativar a zona "${zona.bairro}"? A loja deixa de entregar nesse bairro até ela ser ativada novamente.`,
      rotuloConfirmar: 'Inativar',
      aoConfirmar: executar,
    })
  }

  function excluir(zona) {
    confirmar({
      mensagem: `Excluir a zona "${zona.bairro}"? Essa ação não pode ser desfeita.`,
      rotuloConfirmar: 'Excluir',
      aoConfirmar: async () => {
        try {
          await excluirZona(loja.tenant, zona.id)
          dispatchMsgSuccess('Zona excluída com sucesso')
          setVersao((atual) => atual + 1)
        } catch (e) {
          dispatchMsgError(e.mensagem)
        }
      },
    })
  }

  return (
    <TelaBusca
      titulo="Zonas de entrega"
      chaveFiltros="zonas-entrega"
      placeholder="Buscar por bairro"
      colunas={COLUNAS}
      chaveLinha={(zona) => zona.id}
      buscar={({ busca, filtros, page, size }) => buscarZonas(loja.tenant, { busca, ...filtros, page, size })}
      aoNovo={pode('ZONAS_ENTREGA_INCLUIR') ? () => navigate('/admin/zonas-entrega/novo') : undefined}
      aoAbrir={(zona) => navigate(`/admin/zonas-entrega/${zona.id}`)}
      rotuloNovo="Nova zona"
      chaveAtualizacao={versao}
      acoesExtras={(zona) => [
        ...(pode('ZONAS_ENTREGA_INATIVAR') ? [zona.ativo
          ? { label: 'Inativar', icon: 'pi pi-ban', command: () => alterarAtivo(zona, false) }
          : { label: 'Ativar', icon: 'pi pi-check-circle', command: () => alterarAtivo(zona, true) }] : []),
        ...(pode('ZONAS_ENTREGA_EXCLUIR') ? [{ label: 'Excluir', icon: 'pi pi-trash', command: () => excluir(zona) }] : []),
      ]}
    />
  )
}
