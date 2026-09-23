import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { atualizarProduto, criarProduto, excluirProduto, listarCategorias, listarProdutos } from '../../api/adminApi'
import { formatarMoeda } from '../../utils/formatadores'

const FORM_VAZIO = { categoriaGuid: '', nome: '', descricao: '', preco: '', imagemUrl: '', disponivel: true }

export default function PaginaProdutos() {
  const { usuario } = useAuth()
  const tenant = usuario.tenant

  const [produtos, setProdutos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [form, setForm] = useState(FORM_VAZIO)
  const [editandoGuid, setEditandoGuid] = useState(null)
  const [erro, setErro] = useState(null)

  function carregar() {
    listarProdutos(tenant).then(setProdutos).catch((e) => setErro(e.mensagem))
    listarCategorias(tenant).then(setCategorias).catch((e) => setErro(e.mensagem))
  }

  useEffect(carregar, [tenant])

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    const dados = { ...form, preco: Number(form.preco) }
    try {
      if (editandoGuid) {
        await atualizarProduto(tenant, editandoGuid, dados)
      } else {
        await criarProduto(tenant, dados)
      }
      setForm(FORM_VAZIO)
      setEditandoGuid(null)
      carregar()
    } catch (e) {
      setErro(e.mensagem)
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

  async function handleExcluir(guid) {
    if (!confirm('Excluir este produto?')) return
    await excluirProduto(tenant, guid)
    carregar()
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
          <button type="button" onClick={() => { setEditandoGuid(null); setForm(FORM_VAZIO) }}>
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
            <tr key={produto.guid}>
              <td>{produto.nome}</td>
              <td>{produto.categoriaNome}</td>
              <td>{formatarMoeda(produto.preco)}</td>
              <td>{produto.disponivel ? 'Sim' : 'Nao'}</td>
              <td>
                <button type="button" onClick={() => handleEditar(produto)}>Editar</button>
                <button type="button" onClick={() => handleExcluir(produto.guid)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
