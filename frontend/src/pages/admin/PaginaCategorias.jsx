import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { alterarAtivoCategoria, buscarCategorias, excluirCategoria } from '../../api/categoriasApi'
import TelaBusca from '../../components/crud/TelaBusca'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'

const COLUNAS = [
  { chave: 'nome', cabecalho: 'Nome' },
  { chave: 'ordemExibicao', cabecalho: 'Ordem no cardápio' },
  { chave: 'quantidadeProdutos', cabecalho: 'Produtos' },
]

/** Cardápio > Produtos > Categorias: as categorias em que os produtos finais aparecem no cardápio. */
export default function PaginaCategorias() {
  const { loja } = useAuth()
  const navigate = useNavigate()
  const [versao, setVersao] = useState(0) // muda para recarregar a lista depois de inativar/excluir

  function alterarAtivo(categoria, ativo) {
    const executar = async () => {
      try {
        await alterarAtivoCategoria(loja.tenant, categoria.id, ativo)
        dispatchMsgSuccess(ativo ? 'Categoria ativada com sucesso' : 'Categoria inativada com sucesso')
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
      mensagem: `Inativar "${categoria.nome}"? Ela deixa de aparecer no cardápio até ser ativada novamente.`,
      rotuloConfirmar: 'Inativar',
      aoConfirmar: executar,
    })
  }

  function excluir(categoria) {
    confirmar({
      mensagem: `Excluir "${categoria.nome}"? Essa ação não pode ser desfeita.`,
      rotuloConfirmar: 'Excluir',
      aoConfirmar: async () => {
        try {
          await excluirCategoria(loja.tenant, categoria.id)
          dispatchMsgSuccess('Categoria excluída com sucesso')
          setVersao((atual) => atual + 1)
        } catch (e) {
          dispatchMsgError(e.mensagem)
        }
      },
    })
  }

  return (
    <TelaBusca
      titulo="Categorias"
      chaveFiltros="categorias"
      placeholder="Buscar por nome"
      colunas={COLUNAS}
      chaveLinha={(categoria) => categoria.id}
      buscar={({ busca, filtros, page, size }) => buscarCategorias(loja.tenant, { busca, ...filtros, page, size })}
      aoNovo={() => navigate('/admin/categorias/novo')}
      aoAbrir={(categoria) => navigate(`/admin/categorias/${categoria.id}`)}
      rotuloNovo="Nova categoria"
      chaveAtualizacao={versao}
      acoesExtras={(categoria) => [
        categoria.ativo
          ? { label: 'Inativar', icon: 'pi pi-ban', command: () => alterarAtivo(categoria, false) }
          : { label: 'Ativar', icon: 'pi pi-check-circle', command: () => alterarAtivo(categoria, true) },
        { label: 'Excluir', icon: 'pi pi-trash', command: () => excluir(categoria) },
      ]}
    />
  )
}
