import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { atualizarCategoria, criarCategoria, excluirCategoria, listarCategorias } from '../../api/adminApi'

const FORM_VAZIO = { nome: '', ordemExibicao: 0, ativo: true }

export default function PaginaCategorias() {
  const { usuario } = useAuth()
  const restauranteId = usuario.restauranteId

  const [categorias, setCategorias] = useState([])
  const [form, setForm] = useState(FORM_VAZIO)
  const [editandoId, setEditandoId] = useState(null)
  const [erro, setErro] = useState(null)

  function carregar() {
    listarCategorias(restauranteId).then(setCategorias).catch((e) => setErro(e.mensagem))
  }

  useEffect(carregar, [restauranteId])

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    try {
      if (editandoId) {
        await atualizarCategoria(restauranteId, editandoId, form)
      } else {
        await criarCategoria(restauranteId, form)
      }
      setForm(FORM_VAZIO)
      setEditandoId(null)
      carregar()
    } catch (e) {
      setErro(e.mensagem)
    }
  }

  function handleEditar(categoria) {
    setEditandoId(categoria.id)
    setForm({ nome: categoria.nome, ordemExibicao: categoria.ordemExibicao, ativo: categoria.ativo })
  }

  async function handleExcluir(id) {
    if (!confirm('Excluir esta categoria?')) return
    await excluirCategoria(restauranteId, id)
    carregar()
  }

  return (
    <div className="pagina-admin">
      <h1>Categorias</h1>

      <form onSubmit={handleSubmit} className="formulario-inline">
        <input
          placeholder="Nome da categoria"
          required
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
        />
        <input
          type="number"
          placeholder="Ordem"
          value={form.ordemExibicao}
          onChange={(e) => setForm({ ...form, ordemExibicao: Number(e.target.value) })}
        />
        <label>
          <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />
          Ativa
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
            <th>Ordem</th>
            <th>Ativa</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {categorias.map((categoria) => (
            <tr key={categoria.id}>
              <td>{categoria.nome}</td>
              <td>{categoria.ordemExibicao}</td>
              <td>{categoria.ativo ? 'Sim' : 'Nao'}</td>
              <td>
                <button type="button" onClick={() => handleEditar(categoria)}>Editar</button>
                <button type="button" onClick={() => handleExcluir(categoria.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
