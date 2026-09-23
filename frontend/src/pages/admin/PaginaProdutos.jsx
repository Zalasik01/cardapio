import { useEffect, useState } from 'react'
import TabelaDados from '../../components/TabelaDados'
import { useAuth } from '../../context/AuthContext'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import { atualizarProduto, criarProduto, excluirProduto, listarCategorias, listarProdutos } from '../../api/adminApi'
import { formatarMoeda } from '../../utils/formatadores'

const FORM_VAZIO = { categoriaGuid: '', nome: '', descricao: '', preco: '', imagemUrl: '', disponivel: true }

export default function PaginaProdutos() {
  const { loja } = useAuth()
  const tenant = loja.tenant

  const [produtos, setProdutos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [form, setForm] = useState(FORM_VAZIO)
  const [editandoGuid, setEditandoGuid] = useState(null)
  const [carregando, setCarregando] = useState(true)

  function carregar() {
    Promise.all([listarProdutos(tenant), listarCategorias(tenant)])
      .then(([listaProdutos, listaCategorias]) => {
        setProdutos(listaProdutos)
        setCategorias(listaCategorias)
      })
      .catch((e) => dispatchMsgError(e.mensagem))
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [tenant])

  async function handleSubmit(e) {
    e.preventDefault()
    const dados = { ...form, preco: Number(form.preco) }
    try {
      if (editandoGuid) {
        await atualizarProduto(tenant, editandoGuid, dados)
      } else {
        await criarProduto(tenant, dados)
      }
      dispatchMsgSuccess(editandoGuid ? 'Produto atualizado com sucesso' : 'Produto criado com sucesso')
      setForm(FORM_VAZIO)
      setEditandoGuid(null)
      carregar()
    } catch (e) {
      dispatchMsgError(e.mensagem)
    }
  }

  function handleEditar(produto) {
    setEditandoGuid(produto.guid)
    setForm({
      categoriaGuid: produto.categoriaGuid,
      nome: produto.nome,
      descricao: produto.descricao || '',
      preco: produto.preco,
      imagemUrl: produto.imagemUrl || '',
      disponivel: produto.disponivel,
    })
  }

  function handleExcluir(guid) {
    confirmar({
      mensagem: 'Excluir este produto?',
      aoConfirmar: async () => {
        try {
          await excluirProduto(tenant, guid)
          dispatchMsgSuccess('Produto excluído com sucesso')
          carregar()
        } catch (e) {
          dispatchMsgError(e.mensagem)
        }
      },
    })
  }

  return (
    <div className="pagina-admin">
      <h1>Produtos</h1>

      <form onSubmit={handleSubmit} className="formulario-produto">
        <select required value={form.categoriaGuid} onChange={(e) => setForm({ ...form, categoriaGuid: e.target.value })}>
          <option value="">Categoria</option>
          {categorias.map((c) => (
            <option key={c.guid} value={c.guid}>{c.nome}</option>
          ))}
        </select>
        <input placeholder="Nome" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        <input placeholder="Descricao" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
        <input
          type="number" step="0.01" placeholder="Preco" required
          value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })}
        />
        <input placeholder="URL da imagem" value={form.imagemUrl} onChange={(e) => setForm({ ...form, imagemUrl: e.target.value })} />
        <label>
          <input type="checkbox" checked={form.disponivel} onChange={(e) => setForm({ ...form, disponivel: e.target.checked })} />
          Disponivel
        </label>
        <button type="submit">{editandoGuid ? 'Salvar' : 'Adicionar'}</button>
        {editandoGuid && (
          <button type="button" className="botao-secundario" onClick={() => { setEditandoGuid(null); setForm(FORM_VAZIO) }}>
            Cancelar
          </button>
        )}
      </form>


      <TabelaDados
        dados={produtos}
        chave="guid"
        carregando={carregando}
        colunas={[
          { campo: 'nome', cabecalho: 'Nome' },
          { campo: 'categoriaNome', cabecalho: 'Categoria' },
          { campo: 'preco', cabecalho: 'Preço', corpo: (produto) => formatarMoeda(produto.preco) },
          { campo: 'disponivel', cabecalho: 'Disponível', corpo: (produto) => (produto.disponivel ? 'Sim' : 'Não') },
        ]}
        acoes={(produto) => [
          { label: 'Editar', icon: 'pi pi-pencil', command: () => handleEditar(produto) },
          { label: 'Excluir', icon: 'pi pi-trash', className: 'item-perigo', command: () => handleExcluir(produto.guid) },
        ]}
      />
    </div>
  )
}
