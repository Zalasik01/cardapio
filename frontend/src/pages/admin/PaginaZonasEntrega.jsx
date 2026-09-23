import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { atualizarZonaEntrega, criarZonaEntrega, excluirZonaEntrega, listarZonasEntrega } from '../../api/adminApi'
import { formatarMoeda } from '../../utils/formatadores'

const FORM_VAZIO = { bairro: '', taxa: '', tempoEstimadoMinutos: 45, ativo: true }

export default function PaginaZonasEntrega() {
  const { usuario } = useAuth()
  const restauranteId = usuario.restauranteId

  const [zonas, setZonas] = useState([])
  const [form, setForm] = useState(FORM_VAZIO)
  const [editandoId, setEditandoId] = useState(null)
  const [erro, setErro] = useState(null)

  function carregar() {
    listarZonasEntrega(restauranteId).then(setZonas).catch((e) => setErro(e.mensagem))
  }

  useEffect(carregar, [restauranteId])

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    const dados = { ...form, taxa: Number(form.taxa), tempoEstimadoMinutos: Number(form.tempoEstimadoMinutos) }
    try {
      if (editandoId) {
        await atualizarZonaEntrega(restauranteId, editandoId, dados)
      } else {
        await criarZonaEntrega(restauranteId, dados)
      }
      setForm(FORM_VAZIO)
      setEditandoId(null)
      carregar()
    } catch (e) {
      setErro(e.mensagem)
    }
  }

  function handleEditar(zona) {
    setEditandoId(zona.id)
    setForm({
      bairro: zona.bairro,
      taxa: zona.taxa,
      tempoEstimadoMinutos: zona.tempoEstimadoMinutos,
      ativo: zona.ativo,
    })
  }

  async function handleExcluir(id) {
    if (!confirm('Excluir esta zona de entrega?')) return
    await excluirZonaEntrega(restauranteId, id)
    carregar()
  }

  return (
    <div className="pagina-admin">
      <h1>Zonas de entrega</h1>
      <p className="texto-auxiliar">
        Cadastre uma taxa fixa por bairro. Bairros nao cadastrados usam o calculo por distancia
        configurado no restaurante.
      </p>

      <form onSubmit={handleSubmit} className="formulario-inline">
        <input placeholder="Bairro" required value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} />
        <input
          type="number" step="0.01" placeholder="Taxa" required
          value={form.taxa} onChange={(e) => setForm({ ...form, taxa: e.target.value })}
        />
        <input
          type="number" placeholder="Tempo (min)"
          value={form.tempoEstimadoMinutos} onChange={(e) => setForm({ ...form, tempoEstimadoMinutos: e.target.value })}
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
            <th>Bairro</th>
            <th>Taxa</th>
            <th>Tempo estimado</th>
            <th>Ativa</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {zonas.map((zona) => (
            <tr key={zona.id}>
              <td>{zona.bairro}</td>
              <td>{formatarMoeda(zona.taxa)}</td>
              <td>{zona.tempoEstimadoMinutos} min</td>
              <td>{zona.ativo ? 'Sim' : 'Nao'}</td>
              <td>
                <button type="button" onClick={() => handleEditar(zona)}>Editar</button>
                <button type="button" onClick={() => handleExcluir(zona.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
