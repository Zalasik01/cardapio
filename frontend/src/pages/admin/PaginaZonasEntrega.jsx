import { useEffect, useState } from 'react'
import { TabelaSkeleton } from '../../components/Skeleton'
import { useAuth } from '../../context/AuthContext'
import { atualizarZonaEntrega, criarZonaEntrega, excluirZonaEntrega, listarZonasEntrega } from '../../api/adminApi'
import { formatarMoeda } from '../../utils/formatadores'

const FORM_VAZIO = { bairro: '', taxa: '', tempoEstimadoMinutos: 45, ativo: true }

export default function PaginaZonasEntrega() {
  const { usuario } = useAuth()
  const tenant = usuario.tenant

  const [zonas, setZonas] = useState([])
  const [form, setForm] = useState(FORM_VAZIO)
  const [editandoGuid, setEditandoGuid] = useState(null)
  const [erro, setErro] = useState(null)
  const [carregando, setCarregando] = useState(true)

  function carregar() {
    listarZonasEntrega(tenant)
      .then(setZonas)
      .catch((e) => setErro(e.mensagem))
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [tenant])

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    const dados = { ...form, taxa: Number(form.taxa), tempoEstimadoMinutos: Number(form.tempoEstimadoMinutos) }
    try {
      if (editandoGuid) {
        await atualizarZonaEntrega(tenant, editandoGuid, dados)
      } else {
        await criarZonaEntrega(tenant, dados)
      }
      setForm(FORM_VAZIO)
      setEditandoGuid(null)
      carregar()
    } catch (e) {
      setErro(e.mensagem)
    }
  }

  function handleEditar(zona) {
    setEditandoGuid(zona.guid)
    setForm({
      bairro: zona.bairro,
      taxa: zona.taxa,
      tempoEstimadoMinutos: zona.tempoEstimadoMinutos,
      ativo: zona.ativo,
    })
  }

  async function handleExcluir(guid) {
    if (!confirm('Excluir esta zona de entrega?')) return
    await excluirZonaEntrega(tenant, guid)
    carregar()
  }

  return (
    <div className="pagina-admin">
      <h1>Zonas de entrega</h1>
      <p className="texto-auxiliar">
        Cadastre uma taxa fixa por bairro. Bairros nao cadastrados usam o calculo por distancia
        configurado na loja.
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
        <button type="submit">{editandoGuid ? 'Salvar' : 'Adicionar'}</button>
        {editandoGuid && (
          <button type="button" className="botao-secundario" onClick={() => { setEditandoGuid(null); setForm(FORM_VAZIO) }}>
            Cancelar
          </button>
        )}
      </form>

      {erro && <p className="mensagem-erro">{erro}</p>}

      {carregando ? (
        <TabelaSkeleton cabecalhos={['Bairro', 'Taxa', 'Tempo estimado', 'Ativa', '']} />
      ) : (
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
            <tr key={zona.guid}>
              <td>{zona.bairro}</td>
              <td>{formatarMoeda(zona.taxa)}</td>
              <td>{zona.tempoEstimadoMinutos} min</td>
              <td>{zona.ativo ? 'Sim' : 'Nao'}</td>
              <td>
                <button type="button" className="botao-secundario" onClick={() => handleEditar(zona)}>Editar</button>
                <button type="button" className="botao-perigo" onClick={() => handleExcluir(zona.guid)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  )
}
