import { useEffect, useState } from 'react'
import { FormularioSkeleton } from '../../components/Skeleton'
import { useAuth } from '../../context/AuthContext'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { atualizarLoja, buscarLoja } from '../../api/adminApi'

export default function PaginaLoja() {
  const { loja } = useAuth()
  const tenant = loja.tenant

  const [form, setForm] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    buscarLoja(tenant)
      .then(setForm)
      .catch((e) => {
        setErro(e.mensagem) // a tela mostra o estado de falha no lugar do formulario
        dispatchMsgError(e.mensagem)
      })
  }, [tenant])

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await atualizarLoja(tenant, form)
      dispatchMsgSuccess('Dados atualizados com sucesso')
    } catch (e) {
      dispatchMsgError(e.mensagem)
    }
  }

  if (!form && !erro) {
    return (
      <div className="pagina-admin">
        <h1>Minha loja</h1>
        <FormularioSkeleton campos={5} />
      </div>
    )
  }

  if (!form) {
    return (
      <div className="pagina-admin">
        <h1>Minha loja</h1>
        <p className="mensagem-erro">{erro}</p>
      </div>
    )
  }

  return (
    <div className="pagina-admin">
      <h1>Minha loja</h1>
      <form onSubmit={handleSubmit} className="formulario-restaurante">
        <label>
          Nome
          <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </label>
        <label>
          Descricao
          <textarea value={form.descricao || ''} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
        </label>
        <label>
          Telefone
          <input value={form.telefone || ''} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
        </label>
        <fieldset>
          <legend>Frete por distancia</legend>
          <div className="linha-formulario">
            <label>
              Taxa base (R$)
              <input type="number" step="0.01" value={form.taxaEntregaBase} onChange={(e) => setForm({ ...form, taxaEntregaBase: Number(e.target.value) })} />
            </label>
            <label>
              Taxa por km (R$)
              <input type="number" step="0.01" value={form.taxaEntregaPorKm} onChange={(e) => setForm({ ...form, taxaEntregaPorKm: Number(e.target.value) })} />
            </label>
            <label>
              Distancia maxima (km)
              <input type="number" step="0.1" value={form.distanciaMaximaEntregaKm} onChange={(e) => setForm({ ...form, distanciaMaximaEntregaKm: Number(e.target.value) })} />
            </label>
          </div>
        </fieldset>
        <label>
          Valor minimo do pedido (R$)
          <input type="number" step="0.01" value={form.valorMinimoPedido} onChange={(e) => setForm({ ...form, valorMinimoPedido: Number(e.target.value) })} />
        </label>


        <button type="submit" className="botao-principal">Salvar</button>
      </form>
    </div>
  )
}
