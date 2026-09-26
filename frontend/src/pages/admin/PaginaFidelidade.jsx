import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'primereact/button'
import { Checkbox } from 'primereact/checkbox'
import { InputNumber } from 'primereact/inputnumber'
import { useAuth } from '../../context/AuthContext'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { obterFidelidade, salvarFidelidade } from '../../api/fidelidadeApi'
import { Campo, GradeCampos, SecaoCrud } from '../../components/crud/Campo'
import CrudPagina from '../../components/crud/CrudPagina'
import { CrudSkeleton } from '../../components/Skeleton'

const moeda = { mode: 'currency', currency: 'BRL', locale: 'pt-BR' }

/** Loja > Fidelidade: quanto do pedido volta como cashback, por quanto tempo vale e como o cliente pode usar. */
export default function PaginaFidelidade() {
  const { loja, pode } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    obterFidelidade(loja.tenant)
      .then((c) => setForm({
        programaAtivo: c.programaAtivo, percentual: Number(c.percentual), validadeDias: c.validadeDias,
        resgateMinimo: Number(c.resgateMinimo), resgateMaximoPct: Number(c.resgateMaximoPct),
      }))
      .catch((e) => dispatchMsgError(e.mensagem))
  }, [loja.tenant])

  const definir = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }))
  const podeAlterar = pode('FIDELIDADE_ALTERAR')

  async function salvar(e) {
    e.preventDefault()
    setSalvando(true)
    try {
      await salvarFidelidade(loja.tenant, form)
      dispatchMsgSuccess('Programa de fidelidade atualizado com sucesso')
    } catch (err) {
      dispatchMsgError(err.mensagem)
    } finally {
      setSalvando(false)
    }
  }

  const exemplo = form ? (100 * form.percentual) / 100 : 0

  return (
    <form onSubmit={salvar}>
      <CrudPagina
        somenteLeitura={!podeAlterar}
        titulo="Fidelidade"
        subtitulo="Cashback: o cliente ganha uma parte do pedido de volta e usa nos próximos"
        aoVoltar={() => navigate('/admin/dashboard')}
        rodape={(
          <div className="crud__acoes">
            <span className="crud__espaco" />
            <Button type="button" label="Fechar" severity="secondary" outlined onClick={() => navigate('/admin/dashboard')} />
            {podeAlterar && <Button type="submit" label={salvando ? 'Salvando...' : 'Salvar alterações'} disabled={salvando || !form} />}
          </div>
        )}
      >
        {!form ? <CrudSkeleton blocos={[[4, 4, 4]]} /> : (
          <SecaoCrud id="secao-programa" titulo="Programa de cashback">
            <GradeCampos>
              <div className="campo campo--12 campo--linha">
                <span className="campo-checkbox">
                  <Checkbox inputId="programaAtivo" checked={form.programaAtivo} onChange={(e) => definir('programaAtivo')(e.checked)} />
                  <label htmlFor="programaAtivo">Programa ativo (o cliente logado no cardápio ganha e usa cashback)</label>
                </span>
              </div>
              <Campo id="percentual" rotulo="Cashback (%)" tamanho={3} ajuda={`Sobre o valor dos itens. Em R$ 100,00 em itens volta ${exemplo.toFixed(2).replace('.', ',')}.`}>
                <InputNumber inputId="percentual" value={form.percentual} min={0} max={100} suffix="%" maxFractionDigits={2}
                             onValueChange={(e) => definir('percentual')(e.value ?? 0)} />
              </Campo>
              <Campo id="validadeDias" rotulo="Validade (dias)" tamanho={3} ajuda="Depois disso o cashback do pedido vence.">
                <InputNumber inputId="validadeDias" value={form.validadeDias} min={1} max={730} useGrouping={false}
                             onValueChange={(e) => definir('validadeDias')(e.value ?? 90)} />
              </Campo>
              <Campo id="resgateMinimo" rotulo="Saldo mínimo para usar" tamanho={3} ajuda="O cliente só usa quando o saldo chegar neste valor.">
                <InputNumber inputId="resgateMinimo" value={form.resgateMinimo} min={0} {...moeda}
                             onValueChange={(e) => definir('resgateMinimo')(e.value ?? 0)} />
              </Campo>
              <Campo id="resgateMaximoPct" rotulo="Máximo do pedido (%)" tamanho={3} ajuda="Quanto dos itens pode ser pago com cashback.">
                <InputNumber inputId="resgateMaximoPct" value={form.resgateMaximoPct} min={1} max={100} suffix="%" maxFractionDigits={0}
                             onValueChange={(e) => definir('resgateMaximoPct')(e.value ?? 50)} />
              </Campo>
            </GradeCampos>
            <p className="texto-auxiliar" style={{ marginTop: '1.75rem' }}>
              O cashback é creditado quando o pedido é entregue e volta (com nova validade) se um pedido pago com ele for cancelado.
            </p>
          </SecaoCrud>
        )}
      </CrudPagina>
    </form>
  )
}
