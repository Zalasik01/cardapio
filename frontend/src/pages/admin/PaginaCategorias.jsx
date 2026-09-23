import { useEffect, useState } from 'react'
import { TabelaSkeleton } from '../../components/Skeleton'
import { useAuth } from '../../context/AuthContext'
import { atualizarCategoria, criarCategoria, excluirCategoria, listarCategorias } from '../../api/adminApi'

const FORM_VAZIO = { nome: '', ordemExibicao: 0, ativo: true }

export default function PaginaCategorias() {
  const { loja } = useAuth()
  const tenant = loja.tenant

  const [categorias, setCategorias] = useState([])
  const [form, setForm] = useState(FORM_VAZIO)
  const [editandoGuid, setEditandoGuid] = useState(null)
  const [erro, setErro] = useState(null)
  const [carregando, setCarregando] = useState(true)

  function carregar() {
    listarCategorias(tenant)
      .then(setCategorias)
      .catch((e) => setErro(e.mensagem))
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [tenant])

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    try {
      if (editandoGuid) {
        await atualizarCategoria(tenant, editandoGuid, form)
      } else {
        await criarCategoria(tenant, form)
      }
      setForm(FORM_VAZIO)
      setEditandoGuid(null)
      carregar()
    } catch (e) {
      setErro(e.mensagem)
    }
  }

  function handleEditar(categoria) {
    setEditandoGuid(categoria.guid)
    setForm({ nome: categoria.nome, ordemExibicao: categoria.ordemExibicao, ativo: categoria.ativo })
  }

  async function handleExcluir(guid) {
    if (!confirm('Excluir esta categoria?')) return
    await excluirCategoria(tenant, guid)
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
        <button type="submit">{editandoGuid ? 'Salvar' : 'Adicionar'}</button>
        {editandoGuid && (
          <button type="button" className="botao-secundario" onClick={() => { setEditandoGuid(null); setForm(FORM_VAZIO) }}>
            Cancelar
          </button>
        )}
      </form>

      {erro && <p className="mensagem-erro">{erro}</p>}

      {carregando ? (
        <TabelaSkeleton cabecalhos={['Nome', 'Ordem', 'Ativa', '']} />
      ) : (
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
            <tr key={categoria.guid}>
              <td>{categoria.nome}</td>
              <td>{categoria.ordemExibicao}</td>
              <td>{categoria.ativo ? 'Sim' : 'Nao'}</td>
              <td>
                <button type="button" className="botao-secundario" onClick={() => handleEditar(categoria)}>Editar</button>
                <button type="button" className="botao-perigo" onClick={() => handleExcluir(categoria.guid)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  )
}
