import { useEffect, useState } from 'react'
import TabelaDados from '../../components/TabelaDados'
import { useAuth } from '../../context/AuthContext'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import { atualizarCategoria, criarCategoria, excluirCategoria, listarCategorias } from '../../api/adminApi'

const FORM_VAZIO = { nome: '', ordemExibicao: 0, ativo: true }

export default function PaginaCategorias() {
  const { loja } = useAuth()
  const tenant = loja.tenant

  const [categorias, setCategorias] = useState([])
  const [form, setForm] = useState(FORM_VAZIO)
  const [editandoGuid, setEditandoGuid] = useState(null)
  const [carregando, setCarregando] = useState(true)

  function carregar() {
    listarCategorias(tenant)
      .then(setCategorias)
      .catch((e) => dispatchMsgError(e.mensagem))
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [tenant])

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (editandoGuid) {
        await atualizarCategoria(tenant, editandoGuid, form)
      } else {
        await criarCategoria(tenant, form)
      }
      dispatchMsgSuccess(editandoGuid ? 'Categoria atualizada com sucesso' : 'Categoria criada com sucesso')
      setForm(FORM_VAZIO)
      setEditandoGuid(null)
      carregar()
    } catch (e) {
      dispatchMsgError(e.mensagem)
    }
  }

  function handleEditar(categoria) {
    setEditandoGuid(categoria.guid)
    setForm({ nome: categoria.nome, ordemExibicao: categoria.ordemExibicao, ativo: categoria.ativo })
  }

  function handleExcluir(guid) {
    confirmar({
      mensagem: 'Excluir esta categoria?',
      aoConfirmar: async () => {
        try {
          await excluirCategoria(tenant, guid)
          dispatchMsgSuccess('Categoria excluída com sucesso')
          carregar()
        } catch (e) {
          dispatchMsgError(e.mensagem)
        }
      },
    })
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


      <TabelaDados
        dados={categorias}
        chave="guid"
        carregando={carregando}
        colunas={[
          { campo: 'nome', cabecalho: 'Nome' },
          { campo: 'ordemExibicao', cabecalho: 'Ordem' },
          { campo: 'ativo', cabecalho: 'Ativa', corpo: (categoria) => (categoria.ativo ? 'Sim' : 'Não') },
        ]}
        acoes={(categoria) => [
          { label: 'Editar', icon: 'pi pi-pencil', command: () => handleEditar(categoria) },
          { label: 'Excluir', icon: 'pi pi-trash', className: 'item-perigo', command: () => handleExcluir(categoria.guid) },
        ]}
      />
    </div>
  )
}
