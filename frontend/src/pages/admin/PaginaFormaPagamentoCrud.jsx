import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { Checkbox } from 'primereact/checkbox'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { useAuth } from '../../context/AuthContext'
import { dispatchMsgError, dispatchMsgSuccess, dispatchMsgWarn } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import {
  atualizarFormaPagamento, criarFormaPagamento, excluirFormaPagamento, obterFormaPagamento, obterProximaOrdemFormaPagamento,
} from '../../api/formasPagamentoApi'
import CampoAtivo from '../../components/crud/CampoAtivo'
import { Campo, GradeCampos, SecaoCrud } from '../../components/crud/Campo'
import CrudPagina from '../../components/crud/CrudPagina'
import RodapeCrud from '../../components/crud/RodapeCrud'
import { CrudSkeleton } from '../../components/Skeleton'
import { TIPOS_FORMA_PAGAMENTO } from '../../utils/pagamento'

const ROTA_LISTA = '/admin/formas-pagamento'
const moeda = { mode: 'currency', currency: 'BRL', locale: 'pt-BR' }
const FORM_VAZIO = {
  ativo: true, nome: '', tipo: 'DINHEIRO', taxaPercentual: 0, taxaFixa: 0, valorMinimo: null,
  aceitaEntrega: true, aceitaRetirada: true, ordem: 0,
}

/** Cadastro de forma de pagamento: /admin/formas-pagamento/novo e /admin/formas-pagamento/:id. */
export default function PaginaFormaPagamentoCrud() {
  const { id } = useParams()
  const editando = id !== undefined
  const { loja, pode } = useAuth()
  const navigate = useNavigate()
  const { definirMigalha } = useOutletContext()

  const [form, setForm] = useState(FORM_VAZIO)
  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    definirMigalha(editando ? 'Editando forma de pagamento' : 'Nova forma de pagamento')
    return () => definirMigalha(null)
  }, [editando, definirMigalha])

  // cadastro novo: a ordem já vem com a próxima posição livre
  useEffect(() => {
    if (editando) return
    obterProximaOrdemFormaPagamento(loja.tenant).then((ordem) => setForm((atual) => ({ ...atual, ordem }))).catch(() => {})
  }, [editando, loja.tenant])

  useEffect(() => {
    if (!editando) return
    setCarregando(true)
    obterFormaPagamento(loja.tenant, id)
      .then((forma) => setForm({
        ativo: forma.ativo, nome: forma.nome, tipo: forma.tipo, taxaPercentual: Number(forma.taxaPercentual),
        taxaFixa: Number(forma.taxaFixa), valorMinimo: forma.valorMinimo === null ? null : Number(forma.valorMinimo),
        aceitaEntrega: forma.aceitaEntrega, aceitaRetirada: forma.aceitaRetirada, ordem: forma.ordem ?? 0,
      }))
      .catch((e) => dispatchMsgError(e.mensagem))
      .finally(() => setCarregando(false))
  }, [editando, id, loja.tenant])

  const definir = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.aceitaEntrega && !form.aceitaRetirada) {
      dispatchMsgWarn('Marque entrega, retirada ou as duas.')
      return
    }
    setSalvando(true)
    try {
      if (editando) {
        await atualizarFormaPagamento(loja.tenant, id, form)
        dispatchMsgSuccess('Forma de pagamento atualizada com sucesso')
      } else {
        await criarFormaPagamento(loja.tenant, form)
        dispatchMsgSuccess('Forma de pagamento criada com sucesso')
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
      mensagem: 'Excluir esta forma de pagamento? Os pedidos já feitos não são afetados.',
      aoConfirmar: async () => {
        try {
          await excluirFormaPagamento(loja.tenant, id)
          dispatchMsgSuccess('Forma de pagamento excluída com sucesso')
          navigate(ROTA_LISTA)
        } catch (e) {
          dispatchMsgError(e.mensagem)
        }
      },
    })
  }

  const conteudo = (
    <>
      <SecaoCrud id="secao-principal" titulo="Principal">
        <GradeCampos>
          <CampoAtivo valor={form.ativo} aoAlterar={definir('ativo')} />
          <Campo id="nome" rotulo="Nome" obrigatorio tamanho={6}>
            <InputText id="nome" required maxLength={100} value={form.nome} onChange={(e) => definir('nome')(e.target.value)} />
          </Campo>
          <Campo id="tipo" rotulo="Tipo" obrigatorio tamanho={4}>
            <Dropdown inputId="tipo" value={form.tipo} options={TIPOS_FORMA_PAGAMENTO} optionLabel="rotulo" optionValue="valor"
                      onChange={(e) => definir('tipo')(e.value)} />
          </Campo>
          <Campo id="ordem" rotulo="Ordem" tamanho={2} ajuda="Menor aparece primeiro.">
            <InputNumber inputId="ordem" value={form.ordem} min={0} useGrouping={false}
                         onValueChange={(e) => definir('ordem')(e.value ?? 0)} />
          </Campo>
        </GradeCampos>
      </SecaoCrud>

      <SecaoCrud id="secao-regras" titulo="Taxa e regras">
        <GradeCampos>
          <Campo id="taxaPercentual" rotulo="Taxa (%)" tamanho={3} ajuda="Percentual cobrado sobre o pedido.">
            <InputNumber inputId="taxaPercentual" value={form.taxaPercentual} min={0} max={100} suffix="%"
                         minFractionDigits={0} maxFractionDigits={2}
                         onValueChange={(e) => definir('taxaPercentual')(e.value ?? 0)} />
          </Campo>
          <Campo id="taxaFixa" rotulo="Taxa fixa" tamanho={3} ajuda="Valor fixo somado por pedido.">
            <InputNumber inputId="taxaFixa" value={form.taxaFixa} min={0} {...moeda}
                         onValueChange={(e) => definir('taxaFixa')(e.value ?? 0)} />
          </Campo>
          <Campo id="valorMinimo" rotulo="Valor mínimo do pedido" tamanho={3} ajuda="Vazio = sem mínimo.">
            <InputNumber inputId="valorMinimo" value={form.valorMinimo} min={0} {...moeda}
                         onValueChange={(e) => definir('valorMinimo')(e.value ?? null)} />
          </Campo>
          <div className="campo campo--3 campo--linha">
            <span className="campo-checkbox">
              <Checkbox inputId="aceitaEntrega" checked={form.aceitaEntrega}
                        onChange={(e) => definir('aceitaEntrega')(e.checked)} />
              <label htmlFor="aceitaEntrega">Vale para entrega</label>
            </span>
            <span className="campo-checkbox">
              <Checkbox inputId="aceitaRetirada" checked={form.aceitaRetirada}
                        onChange={(e) => definir('aceitaRetirada')(e.checked)} />
              <label htmlFor="aceitaRetirada">Vale para retirada</label>
            </span>
          </div>
        </GradeCampos>
      </SecaoCrud>
    </>
  )

  return (
    <form onSubmit={handleSubmit}>
      <CrudPagina
        somenteLeitura={!pode(editando ? 'FORMAS_PAGAMENTO_ALTERAR' : 'FORMAS_PAGAMENTO_INCLUIR')}
        titulo={editando ? (carregando ? 'Forma de pagamento' : form.nome) : 'Nova forma de pagamento'}
        subtitulo={editando ? 'Editar forma de pagamento' : 'Cadastro de forma de pagamento'}
        aoVoltar={() => navigate(ROTA_LISTA)}
        rodape={(
          <RodapeCrud editando={editando} carregando={carregando} salvando={salvando} aoExcluir={handleExcluir}
                      podeExcluir={pode('FORMAS_PAGAMENTO_EXCLUIR')}
                      podeSalvar={pode(editando ? 'FORMAS_PAGAMENTO_ALTERAR' : 'FORMAS_PAGAMENTO_INCLUIR')}
                      aoFechar={() => navigate(ROTA_LISTA)} />
        )}
      >
        {carregando ? <CrudSkeleton blocos={[[6, 4, 2], [3, 3, 3, 3]]} /> : conteudo}
      </CrudPagina>
    </form>
  )
}
