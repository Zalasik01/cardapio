import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { alterarAtivoGrupoOpcao, buscarGruposOpcao, excluirGrupoOpcao } from '../../api/gruposOpcaoApi'
import TelaBusca from '../../components/crud/TelaBusca'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'

const regra = (g) => (g.minimo === 0
  ? (g.maximo === 1 ? 'Opcional, 1 opção' : `Opcional, até ${g.maximo}`)
  : (g.minimo === g.maximo ? `Obrigatório, ${g.minimo}` : `Obrigatório, ${g.minimo} a ${g.maximo}`))

const COLUNAS = [
  { chave: 'nome', cabecalho: 'Grupo' },
  { chave: 'regra', cabecalho: 'Regra', render: regra },
  { chave: 'opcoes', cabecalho: 'Opções', render: (g) => g.opcoes.map((o) => o.nome).join(', ') },
  { chave: 'produtos', cabecalho: 'Produtos', render: (g) => g.produtos },
]

/** Cardápio > Adicionais e variações: grupos de opções que os produtos usam (tamanho, adicionais, ponto da carne...). */
export default function PaginaGruposOpcao() {
  const { loja, pode } = useAuth()
  const navigate = useNavigate()
  const [versao, setVersao] = useState(0)

  function alterarAtivo(g, ativo) {
    const executar = async () => {
      try {
        await alterarAtivoGrupoOpcao(loja.tenant, g.id, ativo)
        dispatchMsgSuccess(ativo ? 'Grupo ativado com sucesso' : 'Grupo inativado com sucesso')
        setVersao((v) => v + 1)
      } catch (e) {
        dispatchMsgError(e.mensagem)
      }
    }
    if (ativo) {
      executar()
      return
    }
    confirmar({ mensagem: `Inativar "${g.nome}"? Os produtos deixam de mostrar essas opções ao cliente.`, rotuloConfirmar: 'Inativar', aoConfirmar: executar })
  }

  function excluir(g) {
    confirmar({
      mensagem: `Excluir o grupo "${g.nome}"? Ele sai de todos os produtos; os pedidos já feitos não mudam.`,
      rotuloConfirmar: 'Excluir',
      aoConfirmar: async () => {
        try {
          await excluirGrupoOpcao(loja.tenant, g.id)
          dispatchMsgSuccess('Grupo excluído com sucesso')
          setVersao((v) => v + 1)
        } catch (e) {
          dispatchMsgError(e.mensagem)
        }
      },
    })
  }

  return (
    <TelaBusca
      titulo="Adicionais e variações"
      chaveFiltros="grupos-opcao"
      placeholder="Buscar por nome"
      colunas={COLUNAS}
      chaveLinha={(g) => g.id}
      buscar={({ busca, filtros, page, size }) => buscarGruposOpcao(loja.tenant, { busca, ...filtros, page, size })}
      aoNovo={pode('GRUPOS_OPCAO_INCLUIR') ? () => navigate('/admin/grupos-opcao/novo') : undefined}
      aoAbrir={(g) => navigate(`/admin/grupos-opcao/${g.id}`)}
      rotuloNovo="Novo grupo"
      chaveAtualizacao={versao}
      acoesExtras={(g) => [
        ...(pode('GRUPOS_OPCAO_INATIVAR') ? [g.ativo
          ? { label: 'Inativar', icon: 'pi pi-ban', command: () => alterarAtivo(g, false) }
          : { label: 'Ativar', icon: 'pi pi-check-circle', command: () => alterarAtivo(g, true) }] : []),
        ...(pode('GRUPOS_OPCAO_EXCLUIR') ? [{ label: 'Excluir', icon: 'pi pi-trash', command: () => excluir(g) }] : []),
      ]}
    />
  )
}
