import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from 'primereact/button'
import { Checkbox } from 'primereact/checkbox'
import { ColorPicker } from 'primereact/colorpicker'
import { Dropdown } from 'primereact/dropdown'
import { InputSwitch } from 'primereact/inputswitch'
import { InputText } from 'primereact/inputtext'
import { useAuth } from '../../context/AuthContext'
import { dispatchMsgError, dispatchMsgSuccess, dispatchMsgWarn } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import { obterFluxo, restaurarFluxoPadrao, salvarFluxo } from '../../api/fluxoApi'
import { SecaoCrud } from '../../components/crud/Campo'
import CrudPagina from '../../components/crud/CrudPagina'
import { CrudSkeleton } from '../../components/Skeleton'
import { CATEGORIAS_SITUACAO } from '../../utils/pedido'

const TIPOS_PASSAGEM = [
  { valor: null, rotulo: 'Entrega e retirada' },
  { valor: 'ENTREGA', rotulo: 'Só entrega' },
  { valor: 'RETIRADA', rotulo: 'Só retirada' },
]
const CORES_NOVAS = ['#0ea5e9', '#14b8a6', '#eab308', '#ec4899', '#6366f1', '#84cc16']

/** Converte a resposta do servidor no estado do editor (chave = id para situações existentes). */
function paraEditor(fluxo) {
  return {
    situacoes: fluxo.situacoes.map((s) => ({ ...s, chave: String(s.id), aberta: false })),
    transicoes: fluxo.transicoes.map((t) => ({ de: String(t.de), para: String(t.para), tipoPedido: t.tipoPedido ?? null, rotulo: t.rotulo ?? '' })),
  }
}

/** Uma linha do editor: alça de arrastar, cor, nome, tipo, ativa, e (aberta) para onde o pedido pode ir depois dela. */
function LinhaSituacao({ situacao, todas, transicoes, somenteLeitura, aoAlterar, aoRemover, aoAlternarTransicao, aoAlterarTransicao }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: situacao.chave, disabled: situacao.fixa || somenteLeitura })
  const destinos = todas.filter((s) => s.chave !== situacao.chave && !s.fixa)
  const final = situacao.categoria === 'ENTREGUE' || situacao.categoria === 'CANCELADO'

  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`fluxo__linha${situacao.ativa ? '' : ' fluxo__linha--inativa'}`}>
      <div className="fluxo__cabeca">
        {situacao.fixa ? (
          <span className="fluxo__alca fluxo__alca--fixa" aria-hidden="true"><i className="fa-solid fa-lock" /></span>
        ) : (
          <button type="button" className="fluxo__alca" aria-label={`Reordenar ${situacao.nome}`} {...attributes} {...listeners}>
            <i className="fa-solid fa-grip-vertical" aria-hidden="true" />
          </button>
        )}
        <ColorPicker value={situacao.cor.replace('#', '')} format="hex" disabled={somenteLeitura}
                     onChange={(e) => aoAlterar({ cor: `#${e.value}` })} />
        <InputText className="fluxo__nome" value={situacao.nome} maxLength={60} aria-label="Nome da situação" disabled={somenteLeitura}
                   onChange={(e) => aoAlterar({ nome: e.target.value })} />
        {situacao.fixa ? (
          <span className="fluxo__categoria-fixa">Cancelamento (fixo)</span>
        ) : (
          <Dropdown className="fluxo__categoria" value={situacao.categoria} options={CATEGORIAS_SITUACAO.filter((c) => c.valor !== 'CANCELADO')}
                    optionLabel="rotulo" optionValue="valor" disabled={somenteLeitura} aria-label="Tipo da situação"
                    onChange={(e) => aoAlterar({ categoria: e.value })} />
        )}
        <span className="fluxo__acoes">
          {!situacao.fixa && (
            <span className="fluxo__ativa">
              <InputSwitch checked={situacao.ativa} disabled={somenteLeitura} aria-label="Situação ativa"
                           onChange={(e) => aoAlterar({ ativa: e.value })} />
              <small>{situacao.ativa ? 'Ativa' : 'Inativa'}</small>
            </span>
          )}
          {!situacao.fixa && !final && (
            <Button type="button" icon={situacao.aberta ? 'pi pi-chevron-up' : 'pi pi-share-alt'} severity="secondary" text rounded
                    aria-label="Para onde o pedido pode ir" onClick={() => aoAlterar({ aberta: !situacao.aberta })} />
          )}
          {!situacao.fixa && (
            <Button type="button" icon="pi pi-trash" severity="danger" text rounded aria-label={`Remover ${situacao.nome}`}
                    disabled={somenteLeitura} onClick={aoRemover} />
          )}
        </span>
      </div>

      {situacao.pedidosAbertos > 0 && (
        <small className="fluxo__aviso">{situacao.pedidosAbertos} pedido(s) em andamento nesta situação.</small>
      )}

      {situacao.aberta && !final && (
        <div className="fluxo__destinos">
          <strong>Depois de "{situacao.nome}", o pedido pode ir para:</strong>
          {destinos.length === 0 && <small>Crie outras situações para ligar a esta.</small>}
          {destinos.map((destino) => {
            const passagem = transicoes.find((t) => t.de === situacao.chave && t.para === destino.chave)
            return (
              <div key={destino.chave} className="fluxo__destino">
                <span className="campo-checkbox">
                  <Checkbox inputId={`d-${situacao.chave}-${destino.chave}`} checked={!!passagem} disabled={somenteLeitura}
                            onChange={() => aoAlternarTransicao(situacao.chave, destino.chave)} />
                  <label htmlFor={`d-${situacao.chave}-${destino.chave}`}>
                    <i className="fluxo__ponto" style={{ background: destino.cor }} aria-hidden="true" /> {destino.nome}
                  </label>
                </span>
                {passagem && (
                  <>
                    <Dropdown value={passagem.tipoPedido} options={TIPOS_PASSAGEM} optionLabel="rotulo" optionValue="valor"
                              disabled={somenteLeitura} aria-label="Vale para"
                              onChange={(e) => aoAlterarTransicao(situacao.chave, destino.chave, { tipoPedido: e.value })} />
                    <InputText value={passagem.rotulo} maxLength={60} placeholder="Texto do botão (opcional)" disabled={somenteLeitura}
                               onChange={(e) => aoAlterarTransicao(situacao.chave, destino.chave, { rotulo: e.target.value })} />
                  </>
                )}
              </div>
            )
          })}
          <small>Cancelar o pedido é sempre possível, em qualquer situação.</small>
        </div>
      )}
    </li>
  )
}

/**
 * Loja > Fluxo de pedidos: as colunas do kanban da loja (situações) e para onde cada uma pode ir. Começa com o
 * fluxo padrão; a loja pode renomear, colorir, reordenar, criar e remover situações e ligar as passagens.
 */
export default function PaginaFluxoPedidos() {
  const { loja, pode } = useAuth()
  const navigate = useNavigate()
  const somenteLeitura = !pode('FLUXO_PEDIDOS_ALTERAR')
  const [editor, setEditor] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  useEffect(() => {
    obterFluxo(loja.tenant).then((fluxo) => setEditor(paraEditor(fluxo))).catch((e) => dispatchMsgError(e.mensagem))
  }, [loja.tenant])

  const situacoes = editor?.situacoes ?? []
  const transicoes = editor?.transicoes ?? []
  const modificaveis = useMemo(() => situacoes.filter((s) => !s.fixa), [situacoes])
  const cancelamento = situacoes.find((s) => s.fixa)

  const alterarSituacao = (chave, campos) => setEditor((atual) => ({
    ...atual, situacoes: atual.situacoes.map((s) => (s.chave === chave ? { ...s, ...campos } : s)),
  }))

  function reordenar({ active, over }) {
    if (!over || active.id === over.id) return
    setEditor((atual) => {
      const livres = atual.situacoes.filter((s) => !s.fixa)
      const de = livres.findIndex((s) => s.chave === active.id)
      const para = livres.findIndex((s) => s.chave === over.id)
      const fixas = atual.situacoes.filter((s) => s.fixa)
      return { ...atual, situacoes: [...arrayMove(livres, de, para), ...fixas] }
    })
  }

  function adicionar() {
    const chave = `novo-${Date.now()}`
    setEditor((atual) => {
      const livres = atual.situacoes.filter((s) => !s.fixa)
      const nova = {
        chave, id: null, nome: `Nova situação ${livres.length + 1}`, cor: CORES_NOVAS[livres.length % CORES_NOVAS.length],
        categoria: 'EM_PREPARO', ativa: true, fixa: false, pedidosAbertos: 0, aberta: true,
      }
      return { ...atual, situacoes: [...livres, nova, ...atual.situacoes.filter((s) => s.fixa)] }
    })
  }

  function remover(situacao) {
    if (situacao.pedidosAbertos > 0) {
      dispatchMsgWarn(`"${situacao.nome}" tem ${situacao.pedidosAbertos} pedido(s) em andamento: mova esses pedidos antes de removê-la.`)
      return
    }
    confirmar({
      mensagem: `Remover a situação "${situacao.nome}"? As passagens ligadas a ela também saem do fluxo.`,
      rotuloConfirmar: 'Remover',
      aoConfirmar: () => setEditor((atual) => ({
        situacoes: atual.situacoes.filter((s) => s.chave !== situacao.chave),
        transicoes: atual.transicoes.filter((t) => t.de !== situacao.chave && t.para !== situacao.chave),
      })),
    })
  }

  function alternarTransicao(de, para) {
    setEditor((atual) => {
      const existe = atual.transicoes.some((t) => t.de === de && t.para === para)
      return {
        ...atual,
        transicoes: existe
          ? atual.transicoes.filter((t) => !(t.de === de && t.para === para))
          : [...atual.transicoes, { de, para, tipoPedido: null, rotulo: '' }],
      }
    })
  }

  const alterarTransicao = (de, para, campos) => setEditor((atual) => ({
    ...atual, transicoes: atual.transicoes.map((t) => (t.de === de && t.para === para ? { ...t, ...campos } : t)),
  }))

  /** Liga cada situação ativa à seguinte, na ordem da lista (as finais e o cancelamento ficam de fora). */
  function sequenciaAutomatica() {
    setEditor((atual) => {
      const ativas = atual.situacoes.filter((s) => s.ativa && !s.fixa)
      const novas = []
      ativas.forEach((s, i) => {
        if (s.categoria === 'ENTREGUE' || !ativas[i + 1]) return
        novas.push({ de: s.chave, para: ativas[i + 1].chave, tipoPedido: null, rotulo: '' })
      })
      return { ...atual, transicoes: novas }
    })
    dispatchMsgSuccess('Cada situação agora leva à seguinte, na ordem da lista.')
  }

  async function salvar() {
    setSalvando(true)
    try {
      const fluxo = await salvarFluxo(loja.tenant, {
        situacoes: situacoes.map((s) => ({ chave: s.chave, nome: s.nome, cor: s.cor, categoria: s.categoria, ativa: s.ativa })),
        transicoes: transicoes.map((t) => ({ de: t.de, para: t.para, tipoPedido: t.tipoPedido, rotulo: t.rotulo || null })),
      })
      setEditor(paraEditor(fluxo))
      dispatchMsgSuccess('Fluxo de pedidos salvo com sucesso')
    } catch (e) {
      dispatchMsgError(e.mensagem)
    } finally {
      setSalvando(false)
    }
  }

  function restaurar() {
    confirmar({
      mensagem: 'Voltar ao fluxo padrão? As suas situações e passagens são descartadas; os pedidos passam para a situação padrão equivalente.',
      rotuloConfirmar: 'Restaurar padrão',
      aoConfirmar: async () => {
        try {
          setEditor(paraEditor(await restaurarFluxoPadrao(loja.tenant)))
          dispatchMsgSuccess('Fluxo padrão restaurado')
        } catch (e) {
          dispatchMsgError(e.mensagem)
        }
      },
    })
  }

  const conteudo = editor && (
    <>
      <SecaoCrud id="secao-quadro" titulo="Como fica o quadro">
        <p className="texto-auxiliar">
          Estas são as colunas do painel de pedidos, na ordem. O pedido novo entra na primeira e termina em uma situação de conclusão.
        </p>
        <div className="fluxo__previa" aria-label="Pré-visualização das colunas">
          {situacoes.filter((s) => s.ativa && !s.fixa).map((s) => (
            <span key={s.chave} className="fluxo__coluna" style={{ borderTopColor: s.cor }}>{s.nome}</span>
          ))}
        </div>
      </SecaoCrud>

      <SecaoCrud id="secao-situacoes" titulo="Situações">
        <p className="texto-auxiliar">
          Arraste para reordenar. O <strong>tipo</strong> diz ao sistema o que a situação significa (relatórios, avisos e o painel usam
          o tipo, não o nome). Use o ícone de compartilhar para escolher para onde o pedido pode ir depois de cada situação.
        </p>
        <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={reordenar}>
          <SortableContext items={modificaveis.map((s) => s.chave)} strategy={verticalListSortingStrategy}>
            <ul className="fluxo__lista">
              {modificaveis.map((s) => (
                <LinhaSituacao key={s.chave} situacao={s} todas={situacoes} transicoes={transicoes} somenteLeitura={somenteLeitura}
                               aoAlterar={(campos) => alterarSituacao(s.chave, campos)} aoRemover={() => remover(s)}
                               aoAlternarTransicao={alternarTransicao} aoAlterarTransicao={alterarTransicao} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
        {cancelamento && (
          <ul className="fluxo__lista fluxo__lista--fixa">
            <LinhaSituacao situacao={cancelamento} todas={situacoes} transicoes={transicoes} somenteLeitura={somenteLeitura}
                           aoAlterar={(campos) => alterarSituacao(cancelamento.chave, campos)} aoRemover={() => {}}
                           aoAlternarTransicao={alternarTransicao} aoAlterarTransicao={alterarTransicao} />
          </ul>
        )}
        {!somenteLeitura && (
          <div className="fluxo__botoes">
            <Button type="button" icon="pi pi-plus" label="Nova situação" outlined onClick={adicionar} />
            <Button type="button" icon="pi pi-arrow-down" label="Ligar em sequência" severity="secondary" outlined onClick={sequenciaAutomatica} />
          </div>
        )}
      </SecaoCrud>
    </>
  )

  return (
    <CrudPagina
      titulo="Fluxo de pedidos"
      subtitulo="Situações do kanban e para onde cada uma pode ir"
      rodape={(
        <div className="crud__acoes">
          {!somenteLeitura && <Button type="button" label="Restaurar padrão" icon="pi pi-refresh" severity="secondary" outlined onClick={restaurar} />}
          <span className="crud__espaco" />
          <Button type="button" label="Fechar" severity="secondary" outlined onClick={() => navigate('/admin/dashboard')} />
          {!somenteLeitura && <Button type="button" label={salvando ? 'Salvando...' : 'Salvar alterações'} disabled={salvando || !editor} onClick={salvar} />}
        </div>
      )}
    >
      {editor ? conteudo : <CrudSkeleton blocos={[[12, 12], [12, 12, 12, 12, 12]]} />}
    </CrudPagina>
  )
}
