import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { alterarAtivoCupom, buscarCupons, excluirCupom } from '../../api/cuponsApi'
import TelaBusca from '../../components/crud/TelaBusca'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import { rotuloTipoCupom } from '../../utils/cupom'
import { formatarMoeda } from '../../utils/formatadores'

const desconto = (c) => {
  if (c.tipo === 'PERCENTUAL') return `${String(c.valor).replace('.', ',')}%`
  if (c.tipo === 'VALOR') return formatarMoeda(c.valor)
  return 'Frete grátis'
}

const validade = (c) => {
  const f = (iso) => new Date(iso).toLocaleDateString('pt-BR')
  if (c.inicio && c.fim) return `${f(c.inicio)} a ${f(c.fim)}`
  if (c.fim) return `Até ${f(c.fim)}`
  if (c.inicio) return `A partir de ${f(c.inicio)}`
  return 'Sem prazo'
}

const COLUNAS = [
  { chave: 'codigo', cabecalho: 'Código' },
  { chave: 'tipo', cabecalho: 'Tipo', render: (c) => rotuloTipoCupom(c.tipo) },
  { chave: 'desconto', cabecalho: 'Desconto', render: desconto },
  { chave: 'validade', cabecalho: 'Validade', render: validade },
  { chave: 'usos', cabecalho: 'Usos', render: (c) => (c.limiteTotal ? `${c.usos}/${c.limiteTotal}` : c.usos) },
]

/** Geral > Cupons: códigos de desconto do cardápio online, com regras de uso. */
export default function PaginaCupons() {
  const { loja, pode } = useAuth()
  const navigate = useNavigate()
  const [versao, setVersao] = useState(0)

  function alterarAtivo(cupom, ativo) {
    const executar = async () => {
      try {
        await alterarAtivoCupom(loja.tenant, cupom.id, ativo)
        dispatchMsgSuccess(ativo ? 'Cupom ativado com sucesso' : 'Cupom inativado com sucesso')
        setVersao((v) => v + 1)
      } catch (e) {
        dispatchMsgError(e.mensagem)
      }
    }
    if (ativo) {
      executar()
      return
    }
    confirmar({ mensagem: `Inativar o cupom "${cupom.codigo}"? Os clientes deixam de conseguir usá-lo.`, rotuloConfirmar: 'Inativar', aoConfirmar: executar })
  }

  function excluir(cupom) {
    confirmar({
      mensagem: `Excluir o cupom "${cupom.codigo}"? Os pedidos que já o usaram não são afetados.`,
      rotuloConfirmar: 'Excluir',
      aoConfirmar: async () => {
        try {
          await excluirCupom(loja.tenant, cupom.id)
          dispatchMsgSuccess('Cupom excluído com sucesso')
          setVersao((v) => v + 1)
        } catch (e) {
          dispatchMsgError(e.mensagem)
        }
      },
    })
  }

  return (
    <TelaBusca
      titulo="Cupons"
      chaveFiltros="cupons"
      placeholder="Buscar por código ou descrição"
      colunas={COLUNAS}
      chaveLinha={(c) => c.id}
      buscar={({ busca, filtros, page, size }) => buscarCupons(loja.tenant, { busca, ...filtros, page, size })}
      aoNovo={pode('CUPONS_INCLUIR') ? () => navigate('/admin/cupons/novo') : undefined}
      aoAbrir={(c) => navigate(`/admin/cupons/${c.id}`)}
      rotuloNovo="Novo cupom"
      chaveAtualizacao={versao}
      acoesExtras={(c) => [
        ...(pode('CUPONS_INATIVAR') ? [c.ativo
          ? { label: 'Inativar', icon: 'pi pi-ban', command: () => alterarAtivo(c, false) }
          : { label: 'Ativar', icon: 'pi pi-check-circle', command: () => alterarAtivo(c, true) }] : []),
        ...(pode('CUPONS_EXCLUIR') ? [{ label: 'Excluir', icon: 'pi pi-trash', command: () => excluir(c) }] : []),
      ]}
    />
  )
}
