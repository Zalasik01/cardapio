import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { Calendar } from 'primereact/calendar'
import { Checkbox } from 'primereact/checkbox'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { useAuth } from '../../context/AuthContext'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import { atualizarCupom, criarCupom, excluirCupom, obterCupom } from '../../api/cuponsApi'
import { buscarCategorias } from '../../api/categoriasApi'
import CampoAtivo from '../../components/crud/CampoAtivo'
import { Campo, GradeCampos, SecaoCrud } from '../../components/crud/Campo'
import CrudPagina from '../../components/crud/CrudPagina'
import RodapeCrud from '../../components/crud/RodapeCrud'
import { CrudSkeleton } from '../../components/Skeleton'
import { TIPOS_CUPOM, dataDaApi, dataParaApi } from '../../utils/cupom'

const ROTA_LISTA = '/admin/cupons'
const moeda = { mode: 'currency', currency: 'BRL', locale: 'pt-BR' }
const TIPOS_ENTREGA = [
  { valor: null, rotulo: 'Entrega e retirada' },
  { valor: 'ENTREGA', rotulo: 'Só entrega' },
  { valor: 'RETIRADA', rotulo: 'Só retirada' },
]
const FORM_VAZIO = {
  ativo: true, codigo: '', descricao: '', tipo: 'PERCENTUAL', valor: 10, valorMinimo: null, descontoMaximo: null,
  inicio: null, fim: null, limiteTotal: null, limitePorCliente: null, primeiroPedido: false, tipoEntrega: null,
  idCategoria: null, cumulativo: true,
}

/** Cadastro de cupom: /admin/cupons/novo e /admin/cupons/:id. */
export default function PaginaCupomCrud() {
  const { id } = useParams()
  const editando = id !== undefined
  const { loja, pode } = useAuth()
  const navigate = useNavigate()
  const { definirMigalha } = useOutletContext()

  const [form, setForm] = useState(FORM_VAZIO)
  const [categorias, setCategorias] = useState([])
  const [usos, setUsos] = useState(0)
  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    definirMigalha(editando ? 'Editando cupom' : 'Novo cupom')
    return () => definirMigalha(null)
  }, [editando, definirMigalha])

  useEffect(() => {
    buscarCategorias(loja.tenant, { size: 50 }).then((r) => setCategorias([{ id: null, nome: 'Todos os itens' }, ...r.content])).catch(() => {})
  }, [loja.tenant])

  useEffect(() => {
    if (!editando) return
    setCarregando(true)
    obterCupom(loja.tenant, id)
      .then((c) => {
        setUsos(c.usos)
        setForm({
          ativo: c.ativo, codigo: c.codigo, descricao: c.descricao ?? '', tipo: c.tipo, valor: Number(c.valor),
          valorMinimo: c.valorMinimo == null ? null : Number(c.valorMinimo),
          descontoMaximo: c.descontoMaximo == null ? null : Number(c.descontoMaximo),
          inicio: dataDaApi(c.inicio), fim: dataDaApi(c.fim), limiteTotal: c.limiteTotal, limitePorCliente: c.limitePorCliente,
          primeiroPedido: c.primeiroPedido, tipoEntrega: c.tipoEntrega, idCategoria: c.idCategoria, cumulativo: c.cumulativo,
        })
      })
      .catch((e) => dispatchMsgError(e.mensagem))
      .finally(() => setCarregando(false))
  }, [editando, id, loja.tenant])

  const definir = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSalvando(true)
    const dados = { ...form, codigo: form.codigo.trim().toUpperCase(), inicio: dataParaApi(form.inicio), fim: dataParaApi(form.fim) }
    try {
      if (editando) {
        await atualizarCupom(loja.tenant, id, dados)
        dispatchMsgSuccess('Cupom atualizado com sucesso')
      } else {
        await criarCupom(loja.tenant, dados)
        dispatchMsgSuccess('Cupom criado com sucesso')
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
      mensagem: 'Excluir este cupom? Os pedidos que já o usaram não são afetados.',
      aoConfirmar: async () => {
        try {
          await excluirCupom(loja.tenant, id)
          dispatchMsgSuccess('Cupom excluído com sucesso')
          navigate(ROTA_LISTA)
        } catch (e) {
          dispatchMsgError(e.mensagem)
        }
      },
    })
  }

  const percentual = form.tipo === 'PERCENTUAL'
  const semValor = form.tipo === 'FRETE_GRATIS'

  const conteudo = (
    <>
      <SecaoCrud id="secao-principal" titulo="Principal">
        <GradeCampos>
          <CampoAtivo valor={form.ativo} aoAlterar={definir('ativo')} />
          <Campo id="codigo" rotulo="Código" obrigatorio tamanho={3} ajuda="O cliente digita no checkout. Sem espaços.">
            <InputText id="codigo" required maxLength={40} value={form.codigo}
                       onChange={(e) => definir('codigo')(e.target.value.toUpperCase().replace(/\s/g, ''))} />
          </Campo>
          <Campo id="tipo" rotulo="Tipo de desconto" obrigatorio tamanho={3}>
            <Dropdown inputId="tipo" value={form.tipo} options={TIPOS_CUPOM} optionLabel="rotulo" optionValue="valor"
                      onChange={(e) => definir('tipo')(e.value)} />
          </Campo>
          {!semValor && (
            <Campo id="valor" rotulo={percentual ? 'Percentual' : 'Valor do desconto'} obrigatorio tamanho={3}>
              {percentual
                ? <InputNumber inputId="valor" value={form.valor} min={0} max={100} suffix="%" maxFractionDigits={2}
                               onValueChange={(e) => definir('valor')(e.value ?? 0)} />
                : <InputNumber inputId="valor" value={form.valor} min={0} {...moeda} onValueChange={(e) => definir('valor')(e.value ?? 0)} />}
            </Campo>
          )}
          {percentual && (
            <Campo id="descontoMaximo" rotulo="Desconto máximo" tamanho={3} ajuda="Teto em reais. Vazio = sem teto.">
              <InputNumber inputId="descontoMaximo" value={form.descontoMaximo} min={0} {...moeda}
                           onValueChange={(e) => definir('descontoMaximo')(e.value ?? null)} />
            </Campo>
          )}
          <Campo id="descricao" rotulo="Descrição (interna)" tamanho={12}>
            <InputText id="descricao" maxLength={200} value={form.descricao} onChange={(e) => definir('descricao')(e.target.value)} />
          </Campo>
        </GradeCampos>
      </SecaoCrud>

      <SecaoCrud id="secao-regras" titulo="Regras de uso">
        <GradeCampos>
          <Campo id="inicio" rotulo="Válido a partir de" tamanho={3} ajuda="Vazio = já vale.">
            <Calendar inputId="inicio" value={form.inicio} onChange={(e) => definir('inicio')(e.value)} showTime showIcon
                      dateFormat="dd/mm/yy" hourFormat="24" />
          </Campo>
          <Campo id="fim" rotulo="Válido até" tamanho={3} ajuda="Vazio = sem prazo.">
            <Calendar inputId="fim" value={form.fim} onChange={(e) => definir('fim')(e.value)} showTime showIcon
                      dateFormat="dd/mm/yy" hourFormat="24" minDate={form.inicio ?? undefined} />
          </Campo>
          <Campo id="valorMinimo" rotulo="Pedido mínimo" tamanho={3} ajuda="Soma dos itens. Vazio = sem mínimo.">
            <InputNumber inputId="valorMinimo" value={form.valorMinimo} min={0} {...moeda}
                         onValueChange={(e) => definir('valorMinimo')(e.value ?? null)} />
          </Campo>
          <Campo id="tipoEntrega" rotulo="Vale para" tamanho={3}>
            <Dropdown inputId="tipoEntrega" value={form.tipoEntrega} options={TIPOS_ENTREGA} optionLabel="rotulo" optionValue="valor"
                      onChange={(e) => definir('tipoEntrega')(e.value)} />
          </Campo>
          <Campo id="limiteTotal" rotulo="Limite total de usos" tamanho={3} ajuda={editando ? `Já usado ${usos} vez(es). Vazio = sem limite.` : 'Vazio = sem limite.'}>
            <InputNumber inputId="limiteTotal" value={form.limiteTotal} min={1} useGrouping={false}
                         onValueChange={(e) => definir('limiteTotal')(e.value ?? null)} />
          </Campo>
          <Campo id="limitePorCliente" rotulo="Usos por cliente" tamanho={3} ajuda="Vazio = sem limite.">
            <InputNumber inputId="limitePorCliente" value={form.limitePorCliente} min={1} useGrouping={false}
                         onValueChange={(e) => definir('limitePorCliente')(e.value ?? null)} />
          </Campo>
          {!semValor && (
            <Campo id="idCategoria" rotulo="Desconto vale para" tamanho={3} ajuda="Restringe o desconto aos itens de uma categoria.">
              <Dropdown inputId="idCategoria" value={form.idCategoria} options={categorias} optionLabel="nome" optionValue="id"
                        onChange={(e) => definir('idCategoria')(e.value)} />
            </Campo>
          )}
          <div className="campo campo--3 campo--linha">
            <span className="campo-checkbox">
              <Checkbox inputId="primeiroPedido" checked={form.primeiroPedido} onChange={(e) => definir('primeiroPedido')(e.checked)} />
              <label htmlFor="primeiroPedido">Só no primeiro pedido do cliente</label>
            </span>
            <span className="campo-checkbox">
              <Checkbox inputId="cumulativo" checked={form.cumulativo} onChange={(e) => definir('cumulativo')(e.checked)} />
              <label htmlFor="cumulativo">Vale junto com produtos em promoção</label>
            </span>
          </div>
        </GradeCampos>
      </SecaoCrud>
    </>
  )

  const podeSalvar = pode(editando ? 'CUPONS_ALTERAR' : 'CUPONS_INCLUIR')
  return (
    <form onSubmit={handleSubmit}>
      <CrudPagina
        somenteLeitura={!podeSalvar}
        titulo={editando ? (carregando ? 'Cupom' : form.codigo) : 'Novo cupom'}
        subtitulo={editando ? 'Editar cupom' : 'Cadastro de cupom'}
        aoVoltar={() => navigate(ROTA_LISTA)}
        rodape={(
          <RodapeCrud editando={editando} carregando={carregando} salvando={salvando} aoExcluir={handleExcluir}
                      podeExcluir={pode('CUPONS_EXCLUIR')} podeSalvar={podeSalvar} aoFechar={() => navigate(ROTA_LISTA)} />
        )}
      >
        {carregando ? <CrudSkeleton blocos={[[3, 3, 3, 3], [3, 3, 3, 3]]} /> : conteudo}
      </CrudPagina>
    </form>
  )
}
