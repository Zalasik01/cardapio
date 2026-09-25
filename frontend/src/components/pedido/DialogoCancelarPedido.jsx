import { useEffect, useState } from 'react'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { InputNumber } from 'primereact/inputnumber'
import { InputSwitch } from 'primereact/inputswitch'
import { InputTextarea } from 'primereact/inputtextarea'
import { dispatchMsgWarn } from '../../store/dispatchMsg'

/**
 * Cancelamento de pedido: pede o motivo (opcional) e se a loja cobra taxa de cancelamento (e de quanto).
 * pedido: { id } | null (fechado). aoConfirmar({ motivo, taxaCancelamento }) roda ao confirmar; aoFechar() ao desistir.
 */
export default function DialogoCancelarPedido({ pedido, aoFechar, aoConfirmar, enviando = false }) {
  const [motivo, setMotivo] = useState('')
  const [comTaxa, setComTaxa] = useState(false)
  const [taxa, setTaxa] = useState(null)

  useEffect(() => {
    if (pedido) {
      setMotivo('')
      setComTaxa(false)
      setTaxa(null)
    }
  }, [pedido])

  function confirmar() {
    if (comTaxa && !(taxa > 0)) {
      dispatchMsgWarn('Informe o valor da taxa de cancelamento ou desmarque a cobrança.')
      return
    }
    aoConfirmar({ motivo: motivo.trim() || null, taxaCancelamento: comTaxa ? taxa : 0 })
  }

  return (
    <Dialog header={pedido ? `Cancelar pedido ${pedido.id}` : 'Cancelar pedido'} visible={!!pedido} onHide={aoFechar}
            style={{ width: '28rem', maxWidth: '95vw' }}
            footer={(
              <>
                <Button type="button" label="Voltar" severity="secondary" outlined onClick={aoFechar} />
                <Button type="button" label={enviando ? 'Cancelando...' : 'Cancelar pedido'} severity="danger"
                        disabled={enviando} onClick={confirmar} />
              </>
            )}>
      <div className="grade-campos">
        <div className="campo campo--12">
          <label htmlFor="cancelar-motivo">Motivo do cancelamento (opcional)</label>
          <InputTextarea id="cancelar-motivo" rows={3} autoResize maxLength={500} value={motivo}
                         placeholder="Ex.: cliente desistiu, item em falta, endereço fora da área"
                         onChange={(e) => setMotivo(e.target.value)} />
        </div>
        <div className="campo campo--12 campo--linha">
          <span className="campo-checkbox">
            <InputSwitch inputId="cancelar-taxa" checked={comTaxa} onChange={(e) => setComTaxa(e.value)} />
            <label htmlFor="cancelar-taxa">Cobrar taxa de cancelamento</label>
          </span>
        </div>
        {comTaxa && (
          <div className="campo campo--12">
            <label htmlFor="cancelar-valor">Valor da taxa</label>
            <InputNumber inputId="cancelar-valor" value={taxa} min={0} mode="currency" currency="BRL" locale="pt-BR"
                         onValueChange={(e) => setTaxa(e.value)} />
          </div>
        )}
        <div className="campo campo--12">
          <small className="campo__ajuda">O cancelamento não pode ser desfeito.</small>
        </div>
      </div>
    </Dialog>
  )
}
