import { useEffect, useState } from 'react'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { dataParaIso } from '../../utils/formatadores'
import { PRESETS_PERIODO } from '../../utils/periodo'
import SeletorPeriodo from './SeletorPeriodo'

/**
 * Filtro de período em modal ("Filtrar período" do menu "..." dos widgets). Escolher um atalho ou as duas
 * datas só monta a seleção: o período vale (e o modal fecha) ao clicar em "Aplicar". Devolve { preset }
 * (atalho, que acompanha os dias) ou { inicio, fim } em ISO. "Limpar seleção" recomeça a escolha e
 * "Cancelar" fecha sem mudar nada.
 *
 * Props: aberto, periodo (guardado: { preset } | { inicio, fim }), atual ({ inicio, fim } Date), aoFechar, aoAplicar(periodo).
 */
export default function DialogoPeriodo({ aberto, periodo, atual, aoFechar, aoAplicar }) {
  const [selecao, setSelecao] = useState([atual.inicio, atual.fim])
  const [preset, setPreset] = useState(periodo?.preset ?? null)

  // cada vez que abre, começa pelo período em uso
  useEffect(() => {
    if (aberto) {
      setSelecao([atual.inicio, atual.fim])
      setPreset(PRESETS_PERIODO.some((p) => p.id === periodo?.preset) ? periodo.preset : null)
    }
  }, [aberto]) // eslint-disable-line react-hooks/exhaustive-deps

  function alterar(novaSelecao, presetId = null) {
    setSelecao(novaSelecao)
    setPreset(presetId)
  }

  // só uma data escolhida vale como um dia (início e fim iguais)
  const inicio = selecao?.[0]
  const fim = selecao?.[1] ?? selecao?.[0]

  function aplicar() {
    if (!inicio) return
    aoAplicar(preset ? { preset } : { inicio: dataParaIso(inicio), fim: dataParaIso(fim) })
    aoFechar()
  }

  function limpar() {
    setSelecao(null)
    setPreset(null)
  }

  return (
    <Dialog
      header="Filtrar período"
      visible={aberto}
      onHide={aoFechar}
      style={{ width: 'min(44rem, 96vw)' }}
      footer={(
        <div className="seletor-periodo__rodape">
          <button type="button" className="seletor-periodo__link" onClick={limpar}>Limpar seleção</button>
          <button type="button" className="seletor-periodo__link" onClick={aoFechar}>Cancelar</button>
          <Button type="button" label="Aplicar" size="small" disabled={!inicio} onClick={aplicar} />
        </div>
      )}
    >
      <SeletorPeriodo selecao={selecao} presetAtivo={preset} aoAlterar={alterar} />
    </Dialog>
  )
}
