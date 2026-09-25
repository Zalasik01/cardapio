import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { useAuth } from '../../context/AuthContext'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import { atualizarZona, criarZona, excluirZona, obterZona } from '../../api/zonasApi'
import CampoAtivo from '../../components/crud/CampoAtivo'
import { Campo, GradeCampos, SecaoCrud } from '../../components/crud/Campo'
import CrudPagina from '../../components/crud/CrudPagina'
import RodapeCrud from '../../components/crud/RodapeCrud'
import { CrudSkeleton } from '../../components/Skeleton'

const ROTA_LISTA = '/admin/zonas-entrega'
const moeda = { mode: 'currency', currency: 'BRL', locale: 'pt-BR' }

/** Cadastro de zona de entrega: /admin/zonas-entrega/novo e /admin/zonas-entrega/:id. */
export default function PaginaZonaEntregaCrud() {
  const { id } = useParams()
  const editando = id !== undefined
  const { loja, pode } = useAuth()
  const navigate = useNavigate()
  const { definirMigalha } = useOutletContext()

  const [form, setForm] = useState({ ativo: true, bairro: '', taxa: 0, tempoEstimadoMinutos: 45 })
  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    definirMigalha(editando ? 'Editando zona' : 'Nova zona')
    return () => definirMigalha(null)
  }, [editando, definirMigalha])

  useEffect(() => {
    if (!editando) return
    setCarregando(true)
    obterZona(loja.tenant, id)
      .then((zona) => setForm({
        ativo: zona.ativo, bairro: zona.bairro, taxa: zona.taxa, tempoEstimadoMinutos: zona.tempoEstimadoMinutos,
      }))
      .catch((e) => dispatchMsgError(e.mensagem))
      .finally(() => setCarregando(false))
  }, [editando, id, loja.tenant])

  const definir = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSalvando(true)
    try {
      if (editando) {
        await atualizarZona(loja.tenant, id, form)
        dispatchMsgSuccess('Zona atualizada com sucesso')
      } else {
        await criarZona(loja.tenant, form)
        dispatchMsgSuccess('Zona criada com sucesso')
        navigate(ROTA_LISTA)
      }
    } catch (e2) {
      dispatchMsgError(e2.mensagem)
    } finally {
      setSalvando(false)
    }
  }

  function handleExcluir() {
    confirmar({
      mensagem: 'Excluir esta zona de entrega? Essa ação não pode ser desfeita.',
      aoConfirmar: async () => {
        try {
          await excluirZona(loja.tenant, id)
          dispatchMsgSuccess('Zona excluída com sucesso')
          navigate(ROTA_LISTA)
        } catch (e) {
          dispatchMsgError(e.mensagem)
        }
      },
    })
  }

  const conteudo = (
    <SecaoCrud id="secao-principal" titulo="Principal">
      <GradeCampos>
        <CampoAtivo valor={form.ativo} aoAlterar={definir('ativo')} />
        <Campo id="bairro" rotulo="Bairro" obrigatorio tamanho={6}>
          <InputText id="bairro" required maxLength={255} value={form.bairro} onChange={(e) => definir('bairro')(e.target.value)} />
        </Campo>
        <Campo id="taxa" rotulo="Taxa de entrega" obrigatorio tamanho={3}>
          <InputNumber inputId="taxa" value={form.taxa} min={0} {...moeda} onValueChange={(e) => definir('taxa')(e.value ?? 0)} />
        </Campo>
        <Campo id="tempo" rotulo="Tempo estimado (min)" tamanho={3}>
          <InputNumber inputId="tempo" value={form.tempoEstimadoMinutos} min={1} useGrouping={false}
                       onValueChange={(e) => definir('tempoEstimadoMinutos')(e.value ?? 45)} />
        </Campo>
      </GradeCampos>
    </SecaoCrud>
  )

  return (
    <form onSubmit={handleSubmit}>
      <CrudPagina
        titulo={editando ? (carregando ? 'Zona de entrega' : form.bairro) : 'Nova zona de entrega'}
        subtitulo={editando ? 'Editar zona de entrega' : 'Cadastro de zona de entrega'}
        aoVoltar={() => navigate(ROTA_LISTA)}
        rodape={(
          <RodapeCrud editando={editando} carregando={carregando} salvando={salvando}
                      aoExcluir={handleExcluir} podeExcluir={pode('ZONAS_ENTREGA_EXCLUIR')} podeSalvar={pode(editando ? 'ZONAS_ENTREGA_ALTERAR' : 'ZONAS_ENTREGA_INCLUIR')} aoFechar={() => navigate(ROTA_LISTA)} />
        )}
      >
        {carregando ? <CrudSkeleton blocos={[[6, 3, 3]]} /> : conteudo}
      </CrudPagina>
    </form>
  )
}
