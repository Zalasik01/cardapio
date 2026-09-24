import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from 'primereact/button'
import { Menu } from 'primereact/menu'
import { obterPreferencia, salvarPreferencia } from '../../api/preferenciasApi'
import { dispatchMsgError } from '../../store/dispatchMsg'
import { resolverPeriodo, rotuloPeriodo } from '../../utils/periodo'
import Dica from '../Dica'
import DialogoPeriodo from '../periodo/DialogoPeriodo'
import { DashboardSkeleton } from '../Skeleton'

/** Ordem final: os ids salvos que ainda existem, seguidos dos widgets novos na ordem padrão. */
function ordenar(widgets, salva) {
  const ids = widgets.map((w) => w.id)
  const validos = (salva ?? []).filter((id) => ids.includes(id))
  return [...validos, ...ids.filter((id) => !validos.includes(id))]
}

/** Moldura de um widget: alça para arrastar, dica ("!") e menu "..." (só nos widgets de período). */
function WidgetArrastavel({ widget, contexto, aoFiltrarPeriodo }) {
  const {
    attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging,
  } = useSortable({ id: widget.id })
  const menu = useRef(null)

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`widget widget--${widget.tamanho} ${isDragging ? 'widget--arrastando' : ''}`}
    >
      <div className="widget__acoes">
        {widget.periodo && (
          <>
            <Button type="button" icon="pi pi-ellipsis-h" rounded text severity="secondary" size="small"
                    aria-label="Opções do widget" aria-haspopup="menu" onClick={(e) => menu.current.toggle(e)} />
            <Menu popup ref={menu} model={[
              { label: 'Filtrar período', icon: 'pi pi-calendar', command: () => aoFiltrarPeriodo(widget.periodo) },
            ]} />
          </>
        )}
        {widget.dica && <Dica texto={widget.dica} />}
        <span ref={setActivatorNodeRef} className="widget__alca" tabIndex={0} role="button"
              aria-label="Arrastar para reposicionar" title="Arrastar para reposicionar" {...attributes} {...listeners}>
          <i className="pi pi-arrows-alt" aria-hidden="true" />
        </span>
      </div>
      {widget.titulo && <h2 className="widget__titulo">{widget.titulo}</h2>}
      {widget.conteudo(contexto)}
    </div>
  )
}

/**
 * Painel de dashboard padrão: widgets que o usuário reposiciona arrastando (ou pelo teclado, na alça) e,
 * nos widgets de período, o menu "..." com "Filtrar período" (calendário com atalhos, máx. 90 dias).
 * A posição dos widgets e os períodos escolhidos ficam salvos no servidor, para o usuário logado.
 *
 * Props:
 *  - chave: identifica o dashboard nas preferências do usuário (ex.: "dashboard-gestao")
 *  - widgets: [{ id, tamanho: 'cartao' | 'bloco', titulo?, dica?, periodo?: idDoGrupo, conteudo(contexto) }]
 *    widgets com o mesmo "periodo" compartilham o filtro
 *  - periodosPadrao: { [idDoGrupo]: { preset } } período inicial de cada grupo
 *  - esqueleto: { cartoes, blocos } quantidade do esqueleto exibido enquanto as preferências carregam
 *
 * O conteudo(contexto) recebe { periodo(grupo) -> { inicio, fim, rotulo } (Date) }.
 */
export default function PainelDashboard({ chave, widgets, periodosPadrao = {}, esqueleto }) {
  const [prefs, setPrefs] = useState(null) // { ordem, periodos }; nulo até carregar
  const [filtrando, setFiltrando] = useState(null) // id do grupo de período em edição
  const temporizador = useRef(null)

  useEffect(() => {
    let descartada = false
    obterPreferencia(chave)
      .then((salvas) => !descartada && setPrefs({ ordem: salvas?.ordem ?? [], periodos: salvas?.periodos ?? {} }))
      .catch(() => !descartada && setPrefs({ ordem: [], periodos: {} })) // sem preferências: usa o padrão
    return () => {
      descartada = true
    }
  }, [chave])

  // grava no servidor pouco depois da última alteração
  const salvar = useCallback((novas) => {
    setPrefs(novas)
    clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => {
      salvarPreferencia(chave, novas).catch((e) => dispatchMsgError(e.mensagem))
    }, 400)
  }, [chave])
  useEffect(() => () => clearTimeout(temporizador.current), [])

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const ordem = useMemo(() => ordenar(widgets, prefs?.ordem), [widgets, prefs])
  const porId = useMemo(() => Object.fromEntries(widgets.map((w) => [w.id, w])), [widgets])
  const personalizado = (prefs?.ordem?.length ?? 0) > 0

  const periodoGuardado = (grupo) => prefs?.periodos?.[grupo] ?? periodosPadrao[grupo]
  const contexto = useMemo(() => ({
    periodo: (grupo) => {
      const guardado = prefs?.periodos?.[grupo] ?? periodosPadrao[grupo]
      const resolvido = resolverPeriodo(guardado, periodosPadrao[grupo])
      return { ...resolvido, rotulo: rotuloPeriodo(guardado, resolvido) }
    },
  }), [prefs, periodosPadrao])

  function aoSoltar({ active, over }) {
    if (!over || active.id === over.id) return
    salvar({ ...prefs, ordem: arrayMove(ordem, ordem.indexOf(active.id), ordem.indexOf(over.id)) })
  }

  if (prefs === null) return <DashboardSkeleton {...esqueleto} />

  return (
    <>
      {personalizado && (
        <div className="painel-dashboard__barra">
          <Button type="button" label="Restaurar posições" icon="pi pi-refresh" size="small" text severity="secondary"
                  onClick={() => salvar({ ...prefs, ordem: [] })} />
        </div>
      )}

      <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={aoSoltar}>
        <SortableContext items={ordem} strategy={rectSortingStrategy}>
          <div className="painel-dashboard">
            {ordem.map((id) => (
              <WidgetArrastavel key={id} widget={porId[id]} contexto={contexto} aoFiltrarPeriodo={setFiltrando} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {filtrando && (
        <DialogoPeriodo
          aberto
          periodo={periodoGuardado(filtrando)}
          atual={resolverPeriodo(periodoGuardado(filtrando), periodosPadrao[filtrando])}
          aoFechar={() => setFiltrando(null)}
          aoAplicar={(periodo) => salvar({ ...prefs, periodos: { ...prefs.periodos, [filtrando]: periodo } })}
        />
      )}
    </>
  )
}
