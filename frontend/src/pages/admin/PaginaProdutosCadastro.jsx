import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  alterarAtivoProdutoCadastro, alterarEsgotadoProduto, buscarProdutosCadastro, excluirProdutoCadastro, listarCategoriasCadastro,
} from '../../api/produtosCadastroApi'
import TelaBusca from '../../components/crud/TelaBusca'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import { formatarMoeda } from '../../utils/formatadores'
import { siglaUnidade, TIPOS_PRODUTO } from '../../utils/produto'

const COLUNAS_FINAL = [
  { chave: 'codigo', cabecalho: 'Código', render: (produto) => produto.codigo || '—' },
  { chave: 'nome', cabecalho: 'Nome' },
  { chave: 'categoriaNome', cabecalho: 'Categoria', render: (produto) => produto.categoriaNome || '—' },
  { chave: 'unidadeMedida', cabecalho: 'Unidade', render: (produto) => siglaUnidade(produto.unidadeMedida) },
  { chave: 'preco', cabecalho: 'Preço', render: (produto) => formatarMoeda(produto.preco) },
  { chave: 'disponivel', cabecalho: 'No cardápio', render: (produto) => (produto.disponivel ? 'Sim' : 'Não') },
]

const COLUNAS_INGREDIENTE = [
  { chave: 'codigo', cabecalho: 'Código', render: (produto) => produto.codigo || '—' },
  { chave: 'nome', cabecalho: 'Nome' },
  { chave: 'unidadeMedida', cabecalho: 'Unidade', render: (produto) => siglaUnidade(produto.unidadeMedida) },
  {
    chave: 'custoUnitario',
    cabecalho: 'Custo por unidade',
    render: (produto) => Number(produto.custoUnitario).toLocaleString('pt-BR', {
      style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 4,
    }),
  },
  { chave: 'fornecedorNome', cabecalho: 'Fornecedor', render: (produto) => produto.fornecedorNome || '—' },
]

/**
 * Geral > Produtos > Produtos finais / Ingredientes: a mesma tela de busca para os dois tipos de produto
 * (muda o tipo consultado, as colunas e a rota do cadastro).
 */
export default function PaginaProdutosCadastro({ tipo }) {
  const { loja, pode } = useAuth()
  const navigate = useNavigate()
  const config = TIPOS_PRODUTO[tipo]
  const modulo = tipo === 'FINAL' ? 'PRODUTOS_FINAIS' : 'INGREDIENTES'
  const [categorias, setCategorias] = useState([])
  const [versao, setVersao] = useState(0) // muda para recarregar a lista depois de inativar/excluir

  // o filtro de categoria só existe para produto final
  useEffect(() => {
    if (tipo !== 'FINAL') return
    listarCategoriasCadastro(loja.tenant).then(setCategorias).catch(() => setCategorias([]))
  }, [tipo, loja.tenant])

  const filtros = useMemo(() => (tipo === 'FINAL'
    ? [{
      nome: 'categoriaId',
      rotulo: 'Categoria',
      tipo: 'selecao',
      opcoes: categorias.map((categoria) => ({ valor: String(categoria.id), rotulo: categoria.nome })),
    }]
    : []), [tipo, categorias])

  async function alterarEsgotado(produto, esgotado) {
    try {
      await alterarEsgotadoProduto(loja.tenant, produto.id, esgotado)
      dispatchMsgSuccess(esgotado ? 'Produto marcado como esgotado até o fim do dia' : 'Produto voltou ao cardápio')
      setVersao((atual) => atual + 1)
    } catch (e) {
      dispatchMsgError(e.mensagem)
    }
  }

  function alterarAtivo(produto, ativo) {
    const executar = async () => {
      try {
        await alterarAtivoProdutoCadastro(loja.tenant, produto.id, ativo)
        dispatchMsgSuccess(ativo ? 'Cadastro ativado com sucesso' : 'Cadastro inativado com sucesso')
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
      mensagem: `Inativar "${produto.nome}"? Ele deixa de aparecer nas listas, no cardápio e nos pedidos até ser ativado novamente.`,
      rotuloConfirmar: 'Inativar',
      aoConfirmar: executar,
    })
  }

  function excluir(produto) {
    confirmar({
      mensagem: `Excluir "${produto.nome}"? Essa ação não pode ser desfeita.`,
      rotuloConfirmar: 'Excluir',
      aoConfirmar: async () => {
        try {
          await excluirProdutoCadastro(loja.tenant, produto.id)
          dispatchMsgSuccess('Cadastro excluído com sucesso')
          setVersao((atual) => atual + 1)
        } catch (e) {
          dispatchMsgError(e.mensagem)
        }
      },
    })
  }

  return (
    <TelaBusca
      key={tipo}
      titulo={config.titulo}
      chaveFiltros={config.chaveFiltros}
      placeholder="Buscar por nome ou código"
      colunas={tipo === 'FINAL' ? COLUNAS_FINAL : COLUNAS_INGREDIENTE}
      filtros={filtros}
      chaveLinha={(produto) => produto.id}
      buscar={({ busca, filtros: valores, page, size }) =>
        buscarProdutosCadastro(loja.tenant, { tipo, busca, ...valores, page, size })}
      aoNovo={pode(`${modulo}_INCLUIR`) ? () => navigate(`${config.rota}/novo`) : undefined}
      aoAbrir={(produto) => navigate(`${config.rota}/${produto.id}`)}
      rotuloNovo={config.novo}
      chaveAtualizacao={versao}
      acoesExtras={(produto) => [
        ...(tipo === 'FINAL' && pode('PRODUTOS_FINAIS_ALTERAR') ? [produto.esgotadoAte && new Date(produto.esgotadoAte) > new Date()
          ? { label: 'Voltou ao cardápio', icon: 'pi pi-replay', command: () => alterarEsgotado(produto, false) }
          : { label: 'Esgotado hoje', icon: 'pi pi-clock', command: () => alterarEsgotado(produto, true) }] : []),
        ...(pode(`${modulo}_INATIVAR`) ? [produto.ativo
          ? { label: 'Inativar', icon: 'pi pi-ban', command: () => alterarAtivo(produto, false) }
          : { label: 'Ativar', icon: 'pi pi-check-circle', command: () => alterarAtivo(produto, true) }] : []),
        ...(pode(`${modulo}_EXCLUIR`) ? [{ label: 'Excluir', icon: 'pi pi-trash', command: () => excluir(produto) }] : []),
      ]}
    />
  )
}
