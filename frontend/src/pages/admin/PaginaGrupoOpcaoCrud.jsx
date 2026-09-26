import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { Button } from 'primereact/button'
import { Checkbox } from 'primereact/checkbox'
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { useAuth } from '../../context/AuthContext'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import { atualizarGrupoOpcao, criarGrupoOpcao, excluirGrupoOpcao, obterGrupoOpcao } from '../../api/gruposOpcaoApi'
import CampoAtivo from '../../components/crud/CampoAtivo'
import { Campo, GradeCampos, SecaoCrud } from '../../components/crud/Campo'
import CrudPagina from '../../components/crud/CrudPagina'
import RodapeCrud from '../../components/crud/RodapeCrud'
import { CrudSkeleton } from '../../components/Skeleton'
import { idLocal } from '../../utils/pessoa'

const ROTA_LISTA = '/admin/grupos-opcao'
const moeda = { mode: 'currency', currency: 'BRL', locale: 'pt-BR' }
const novaOpcao = () => ({ _id: idLocal(), id: null, nome: '', preco: 0, disponivel: true })
const FORM_VAZIO = { ativo: true, nome: '', descricao: '', minimo: 0, maximo: 1, opcoes: [novaOpcao(), novaOpcao()] }

/** Cadastro de um grupo de opções: /admin/grupos-opcao/novo e /admin/grupos-opcao/:id. */
export default function PaginaGrupoOpcaoCrud() {
  const { id } = useParams()
  const editando = id !== undefined
  const { loja, pode } = useAuth()
  const navigate = useNavigate()
  const { definirMigalha } = useOutletContext()

  const [form, setForm] = useState(FORM_VAZIO)
  const [produtos, setProdutos] = useState(0)
  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    definirMigalha(editando ? 'Editando grupo de opções' : 'Novo grupo de opções')
    return () => definirMigalha(null)
  }, [editando, definirMigalha])

  useEffect(() => {
    if (!editando) return
    setCarregando(true)
    obterGrupoOpcao(loja.tenant, id)
      .then((g) => {
        setProdutos(g.produtos)
        setForm({
          ativo: g.ativo, nome: g.nome, descricao: g.descricao ?? '', minimo: g.minimo, maximo: g.maximo,
          opcoes: g.opcoes.map((o) => ({ _id: idLocal(), id: o.id, nome: o.nome, preco: Number(o.preco), disponivel: o.disponivel })),
        })
      })
      .catch((e) => dispatchMsgError(e.mensagem))
      .finally(() => setCarregando(false))
  }, [editando, id, loja.tenant])

  const definir = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }))
  const alterarOpcao = (i, campos) => setForm((atual) => ({ ...atual, opcoes: atual.opcoes.map((o, j) => (j === i ? { ...o, ...campos } : o)) }))
  const mover = (i, delta) => setForm((atual) => {
    const lista = [...atual.opcoes]
    const j = i + delta
    if (j < 0 || j >= lista.length) return atual
    ;[lista[i], lista[j]] = [lista[j], lista[i]]
    return { ...atual, opcoes: lista }
  })

  async function handleSubmit(e) {
    e.preventDefault()
    const opcoes = form.opcoes.filter((o) => o.nome.trim())
    if (opcoes.length === 0) {
      dispatchMsgError('Cadastre ao menos uma opção.')
      return
    }
    const dados = { ...form, opcoes: opcoes.map(({ id: oid, nome, preco, disponivel }) => ({ id: oid, nome: nome.trim(), preco, disponivel })) }
    setSalvando(true)
    try {
      if (editando) {
        await atualizarGrupoOpcao(loja.tenant, id, dados)
        dispatchMsgSuccess('Grupo atualizado com sucesso')
      } else {
        await criarGrupoOpcao(loja.tenant, dados)
        dispatchMsgSuccess('Grupo criado com sucesso')
        navigate(ROTA_LISTA)
      }
    } catch (err) {
      dispatchMsgError(err.mensagem)
    } finally {
      setSalvando(false)
    }
  }

  function handleExcluir() {
    confirmar({
      mensagem: 'Excluir este grupo? Ele sai de todos os produtos; os pedidos já feitos não mudam.',
      aoConfirmar: async () => {
        try {
          await excluirGrupoOpcao(loja.tenant, id)
          dispatchMsgSuccess('Grupo excluído com sucesso')
          navigate(ROTA_LISTA)
        } catch (e) {
          dispatchMsgError(e.mensagem)
        }
      },
    })
  }

  const regra = form.minimo === 0
    ? (form.maximo === 1 ? 'O cliente pode escolher 1 opção (ou nenhuma).' : `O cliente pode escolher até ${form.maximo} opções (ou nenhuma).`)
    : (form.maximo === form.minimo
      ? `O cliente precisa escolher exatamente ${form.minimo} opção(ões).`
      : `O cliente precisa escolher de ${form.minimo} a ${form.maximo} opções.`)

  const conteudo = (
    <>
      <SecaoCrud id="secao-principal" titulo="Principal">
        <GradeCampos>
          <CampoAtivo valor={form.ativo} aoAlterar={definir('ativo')} />
          <Campo id="nome" rotulo="Nome do grupo" obrigatorio tamanho={4} ajuda="Ex.: Tamanho, Adicionais, Ponto da carne.">
            <InputText id="nome" required maxLength={100} value={form.nome} onChange={(e) => definir('nome')(e.target.value)} />
          </Campo>
          <Campo id="descricao" rotulo="Instrução para o cliente" tamanho={4} ajuda="Aparece abaixo do nome (opcional).">
            <InputText id="descricao" maxLength={200} value={form.descricao} onChange={(e) => definir('descricao')(e.target.value)} />
          </Campo>
          <Campo id="minimo" rotulo="Mínimo a escolher" tamanho={2} ajuda="0 = opcional; 1 ou mais = obrigatório.">
            <InputNumber inputId="minimo" value={form.minimo} min={0} max={20} useGrouping={false} onValueChange={(e) => definir('minimo')(e.value ?? 0)} />
          </Campo>
          <Campo id="maximo" rotulo="Máximo a escolher" tamanho={2} ajuda="1 = escolha única.">
            <InputNumber inputId="maximo" value={form.maximo} min={1} max={20} useGrouping={false} onValueChange={(e) => definir('maximo')(e.value ?? 1)} />
          </Campo>
        </GradeCampos>
        <p className="texto-auxiliar">{regra}{editando && produtos > 0 ? ` Usado em ${produtos} produto(s).` : ''}</p>
      </SecaoCrud>

      <SecaoCrud id="secao-opcoes" titulo="Opções">
        <div className="grupo-opcoes">
          {form.opcoes.map((o, i) => (
            <div key={o._id} className="grupo-opcoes__linha">
              <span className="grupo-opcoes__ordem">
                <Button type="button" icon="pi pi-chevron-up" text rounded size="small" severity="secondary" aria-label="Subir" disabled={i === 0} onClick={() => mover(i, -1)} />
                <Button type="button" icon="pi pi-chevron-down" text rounded size="small" severity="secondary" aria-label="Descer" disabled={i === form.opcoes.length - 1} onClick={() => mover(i, 1)} />
              </span>
              <InputText placeholder="Nome da opção (ex.: Bacon)" maxLength={100} value={o.nome} aria-label="Nome da opção" onChange={(e) => alterarOpcao(i, { nome: e.target.value })} />
              <InputNumber value={o.preco} min={0} {...moeda} inputClassName="grupo-opcoes__preco" aria-label="Preço adicional" onValueChange={(e) => alterarOpcao(i, { preco: e.value ?? 0 })} />
              <span className="campo-checkbox">
                <Checkbox inputId={`disp-${o._id}`} checked={o.disponivel} onChange={(e) => alterarOpcao(i, { disponivel: e.checked })} />
                <label htmlFor={`disp-${o._id}`}>Disponível</label>
              </span>
              <Button type="button" icon="pi pi-trash" text rounded severity="danger" aria-label="Remover opção"
                      onClick={() => setForm((atual) => ({ ...atual, opcoes: atual.opcoes.filter((_, j) => j !== i) }))} />
            </div>
          ))}
        </div>
        <Button type="button" label="Adicionar opção" icon="pi pi-plus" outlined onClick={() => setForm((atual) => ({ ...atual, opcoes: [...atual.opcoes, novaOpcao()] }))} />
        <p className="texto-auxiliar">Preço adicional em R$ 0,00 = sem custo (ex.: tamanhos, ponto da carne). "Disponível" desmarcado mostra a opção como esgotada.</p>
      </SecaoCrud>
    </>
  )

  const podeSalvar = pode(editando ? 'GRUPOS_OPCAO_ALTERAR' : 'GRUPOS_OPCAO_INCLUIR')
  return (
    <form onSubmit={handleSubmit}>
      <CrudPagina
        somenteLeitura={!podeSalvar}
        titulo={editando ? (carregando ? 'Grupo de opções' : form.nome) : 'Novo grupo de opções'}
        subtitulo="Adicionais e variações que o cliente escolhe no produto"
        aoVoltar={() => navigate(ROTA_LISTA)}
        rodape={(
          <RodapeCrud editando={editando} carregando={carregando} salvando={salvando} aoExcluir={handleExcluir}
                      podeExcluir={pode('GRUPOS_OPCAO_EXCLUIR')} podeSalvar={podeSalvar} aoFechar={() => navigate(ROTA_LISTA)} />
        )}
      >
        {carregando ? <CrudSkeleton blocos={[[4, 4, 2, 2], [12]]} /> : conteudo}
      </CrudPagina>
    </form>
  )
}
