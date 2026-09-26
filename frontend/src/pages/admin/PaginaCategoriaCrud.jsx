import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { useAuth } from '../../context/AuthContext'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import {
  atualizarCategoria, criarCategoria, excluirCategoria, obterCategoria, obterProximaOrdemCategoria,
} from '../../api/categoriasApi'
import CampoAtivo from '../../components/crud/CampoAtivo'
import { Campo, GradeCampos, SecaoCrud } from '../../components/crud/Campo'
import CrudPagina from '../../components/crud/CrudPagina'
import RodapeCrud from '../../components/crud/RodapeCrud'
import { CrudSkeleton } from '../../components/Skeleton'

const ROTA_LISTA = '/admin/categorias'

/** Cadastro de categoria: /admin/categorias/novo e /admin/categorias/:id. */
export default function PaginaCategoriaCrud() {
  const { id } = useParams()
  const editando = id !== undefined
  const { loja, pode } = useAuth()
  const navigate = useNavigate()
  const { definirMigalha } = useOutletContext()

  const [form, setForm] = useState({ ativo: true, nome: '', ordemExibicao: 0, tempoPreparoMinutos: null })
  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    definirMigalha(editando ? 'Editando categoria' : 'Nova categoria')
    return () => definirMigalha(null)
  }, [editando, definirMigalha])

  // cadastro novo: a ordem já vem com a próxima posição livre
  useEffect(() => {
    if (editando) return
    obterProximaOrdemCategoria(loja.tenant).then((ordem) => setForm((atual) => ({ ...atual, ordemExibicao: ordem }))).catch(() => {})
  }, [editando, loja.tenant])

  useEffect(() => {
    if (!editando) return
    setCarregando(true)
    obterCategoria(loja.tenant, id)
      .then((categoria) => setForm({ ativo: categoria.ativo, nome: categoria.nome, ordemExibicao: categoria.ordemExibicao ?? 0, tempoPreparoMinutos: categoria.tempoPreparoMinutos ?? null }))
      .catch((e) => dispatchMsgError(e.mensagem))
      .finally(() => setCarregando(false))
  }, [editando, id, loja.tenant])

  const definir = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSalvando(true)
    try {
      if (editando) {
        await atualizarCategoria(loja.tenant, id, form)
        dispatchMsgSuccess('Categoria atualizada com sucesso')
      } else {
        await criarCategoria(loja.tenant, form)
        dispatchMsgSuccess('Categoria criada com sucesso')
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
      mensagem: 'Excluir esta categoria? Essa ação não pode ser desfeita.',
      aoConfirmar: async () => {
        try {
          await excluirCategoria(loja.tenant, id)
          dispatchMsgSuccess('Categoria excluída com sucesso')
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
        <Campo id="nome" rotulo="Nome" obrigatorio tamanho={8}>
          <InputText id="nome" required maxLength={255} value={form.nome} onChange={(e) => definir('nome')(e.target.value)} />
        </Campo>
        <Campo id="ordem" rotulo="Ordem no cardápio" tamanho={4} ajuda="Menor aparece primeiro.">
          <InputNumber inputId="ordem" value={form.ordemExibicao} min={0} useGrouping={false}
                       onValueChange={(e) => definir('ordemExibicao')(e.value ?? 0)} />
        </Campo>
        <Campo id="tempo-preparo" rotulo="Tempo de preparo (min)" tamanho={4}
               ajuda="Vale para os produtos da categoria que não têm o próprio tempo. Vazio = padrão da loja.">
          <InputNumber inputId="tempo-preparo" value={form.tempoPreparoMinutos} min={1} useGrouping={false}
                       onValueChange={(e) => definir('tempoPreparoMinutos')(e.value ?? null)} />
        </Campo>
      </GradeCampos>
    </SecaoCrud>
  )

  return (
    <form onSubmit={handleSubmit}>
      <CrudPagina
        somenteLeitura={!pode(editando ? 'CATEGORIAS_ALTERAR' : 'CATEGORIAS_INCLUIR')}
        titulo={editando ? (carregando ? 'Categoria' : form.nome) : 'Nova categoria'}
        subtitulo={editando ? 'Editar categoria' : 'Cadastro de categoria'}
        aoVoltar={() => navigate(ROTA_LISTA)}
        rodape={(
          <RodapeCrud editando={editando} carregando={carregando} salvando={salvando}
                      aoExcluir={handleExcluir} podeExcluir={pode('CATEGORIAS_EXCLUIR')} podeSalvar={pode(editando ? 'CATEGORIAS_ALTERAR' : 'CATEGORIAS_INCLUIR')} aoFechar={() => navigate(ROTA_LISTA)} />
        )}
      >
        {carregando ? <CrudSkeleton blocos={[[8, 4]]} /> : conteudo}
      </CrudPagina>
    </form>
  )
}
