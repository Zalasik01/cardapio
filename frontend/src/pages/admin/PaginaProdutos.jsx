import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { atualizarProduto, criarProduto, excluirProduto, listarCategorias, listarProdutos } from '../../api/adminApi'
import { formatarMoeda } from '../../utils/formatadores'

const FORM_VAZIO = { categoriaId: '', nome: '', descricao: '', preco: '', imagemUrl: '', disponivel: true }

export default function PaginaProdutos() {
  const { usuario } = useAuth()
  const restauranteId = usuario.restauranteId

  const [produtos, setProdutos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [form, setForm] = useState(FORM_VAZIO)
  const [editandoId, setEditandoId] = useState(null)
  const [erro, setErro] = useState(null)

  function carregar() {
    listarProdutos(restauranteId).then(setProdutos).catch((e) => setErro(e.mensagem))
    listarCategorias(restauranteId).then(setCategorias).catch((e) => setErro(e.mensagem))
  }

  useEffect(carregar, [restauranteId])

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    const dados = { ...form, categoriaId: Number(form.categoriaId), preco: Number(form.preco) }
    try {
      if (editandoId) {
        await atualizarProduto(restauranteId, editandoId, dados)
      } else {
        await criarProduto(restauranteId, dados)
      }
      setForm(FORM_VAZIO)
      setEditandoId(null)
      carregar()
    } catch (e) {
      setErro(e.mensagem)
    }
  }

  function handleEditar(produto) {
    setEditandoId(produto.id)
    setForm({
      categoriaId: produto.categoriaId,
      nome: produto.nome,
      descricao: produto.descricao || '',
      preco: produto.preco,
      imagemUrl: produto.imagemUrl || '',
      disponivel: produto.disponivel,
    })
  }

  async function handleExcluir(id) {
    if (!confirm('Excluir este produto?')) return
    await excluirProduto(restauranteId, id)
    carregar()
  }

  return (
    <div className="pagina-admin">
      <h1>Produtos</h1>

      <form onSubmit={handleSubmit} className="formulario-produto">
        <select required value={form.categoriaId} onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}>
          <option value="">Categoria</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
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
        <button type="submit">{editandoId ? 'Salvar' : 'Adicionar'}</button>
        {editandoId && (
          <button type="button" onClick={() => { setEditandoId(null); setForm(FORM_VAZIO) }}>
            Cancelar
          </button>
        )}
      </form>

      {erro && <p className="mensagem-erro">{erro}</p>}

      <table className="tabela-admin">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Categoria</th>
            <th>Preco</th>
            <th>Disponivel</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {produtos.map((produto) => (
            <tr key={produto.id}>
              <td>{produto.nome}</td>
              <td>{produto.categoriaNome}</td>
              <td>{formatarMoeda(produto.preco)}</td>
              <td>{produto.disponivel ? 'Sim' : 'Nao'}</td>
              <td>
                <button type="button" onClick={() => handleEditar(produto)}>Editar</button>
                <button type="button" onClick={() => handleExcluir(produto.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
