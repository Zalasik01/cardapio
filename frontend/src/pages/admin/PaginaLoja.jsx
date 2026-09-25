import { useEffect, useState } from 'react'
import { Button } from 'primereact/button'
import { InputMask } from 'primereact/inputmask'
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { RadioButton } from 'primereact/radiobutton'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { atualizarLoja, buscarLoja, enviarImagemLoja } from '../../api/adminApi'
import { obterFuncionamento, salvarFuncionamento } from '../../api/funcionamentoApi'
import { Campo, GradeCampos, SecaoCrud } from '../../components/crud/Campo'
import CrudPagina from '../../components/crud/CrudPagina'
import DropzoneImagem from '../../components/DropzoneImagem'
import Endereco from '../../components/crud/Endereco'
import HorarioFuncionamento from '../../components/loja/HorarioFuncionamento'
import { CrudSkeleton } from '../../components/Skeleton'
import { avisarFuncionamentoAlterado, cortarSegundos, MODOS_FUNCIONAMENTO } from '../../utils/funcionamento'

const moeda = { mode: 'currency', currency: 'BRL', locale: 'pt-BR' }

const ANCORAS = [
  { id: 'secao-principal', titulo: 'Principal' },
  { id: 'secao-endereco', titulo: 'Endereço' },
  { id: 'secao-entrega', titulo: 'Entrega' },
  { id: 'secao-funcionamento', titulo: 'Horário de funcionamento' },
]

/**
 * Geral > Minha loja: dados da própria loja, regras de entrega e horário de funcionamento (que define quando
 * a loja aparece como aberta ou fechada no cabeçalho e quando aceita pedidos).
 */
export default function PaginaLoja() {
  const { loja, pode } = useAuth()
  const navigate = useNavigate()
  const tenant = loja.tenant

  const [form, setForm] = useState(null) // dados da loja (o servidor devolve tudo o que o PUT precisa)
  const [funcionamento, setFuncionamento] = useState({ modo: 'AUTOMATICO', horarios: [] })
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    Promise.all([buscarLoja(tenant), obterFuncionamento(tenant)])
      .then(([dadosLoja, dadosFuncionamento]) => {
        setForm(dadosLoja)
        setFuncionamento({
          modo: dadosFuncionamento.modo,
          horarios: dadosFuncionamento.horarios.map((h) => ({
            diaSemana: h.diaSemana, abre: cortarSegundos(h.abre), fecha: cortarSegundos(h.fecha),
          })),
        })
      })
      .catch((e) => {
        setErro(e.mensagem)
        dispatchMsgError(e.mensagem)
      })
  }, [tenant])

  const definir = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }))
  const definirTexto = (campo) => (e) => definir(campo)(e.target.value)

  async function handleSubmit(e) {
    e.preventDefault()
    setSalvando(true)
    try {
      if (pode('MINHA_LOJA_ALTERAR')) await atualizarLoja(tenant, form)
      if (pode('MINHA_LOJA_HORARIO')) {
        await salvarFuncionamento(tenant, funcionamento)
        avisarFuncionamentoAlterado() // o selo do cabeçalho consulta de novo
      }
      dispatchMsgSuccess('Dados atualizados com sucesso')
    } catch (e2) {
      dispatchMsgError(e2.mensagem)
    } finally {
      setSalvando(false)
    }
  }

  // a loja guarda o endereço em campos "enderecoXxx"; o bloco de endereço trabalha com nomes curtos
  const enderecoDaLoja = form && {
    cep: form.enderecoCep ?? '', logradouro: form.enderecoRua ?? '', numero: form.enderecoNumero ?? '',
    complemento: '', bairro: form.enderecoBairro ?? '', cidade: form.enderecoCidade ?? '', estado: form.enderecoEstado ?? null,
  }

  function alterarEndereco(campos) {
    setForm((atual) => {
      const atualCurto = {
        cep: atual.enderecoCep ?? '', logradouro: atual.enderecoRua ?? '', numero: atual.enderecoNumero ?? '',
        complemento: '', bairro: atual.enderecoBairro ?? '', cidade: atual.enderecoCidade ?? '', estado: atual.enderecoEstado ?? null,
      }
      const novos = typeof campos === 'function' ? campos(atualCurto) : campos
      const nomes = { cep: 'enderecoCep', logradouro: 'enderecoRua', numero: 'enderecoNumero', bairro: 'enderecoBairro', cidade: 'enderecoCidade', estado: 'enderecoEstado' }
      const alterados = Object.fromEntries(Object.entries(novos).filter(([chave]) => nomes[chave]).map(([chave, valor]) => [nomes[chave], valor]))
      return { ...atual, ...alterados }
    })
  }

  const carregando = !form && !erro

  const conteudo = form && (
    <>
      <SecaoCrud id="secao-principal" titulo="Principal">
        <GradeCampos>
          <Campo id="nome" rotulo="Nome" obrigatorio tamanho={8}>
            <InputText id="nome" required maxLength={255} value={form.nome} onChange={definirTexto('nome')} />
          </Campo>
          <Campo id="telefone" rotulo="Telefone" tamanho={4}>
            <InputMask id="telefone" mask="(99) 99999-9999" autoClear={false} value={form.telefone ?? ''}
                       onChange={(e) => definir('telefone')(e.target.value ?? '')} />
          </Campo>
          <Campo id="descricao" rotulo="Descrição (aparece no cardápio)">
            <InputTextarea id="descricao" rows={3} maxLength={255} autoResize value={form.descricao ?? ''}
                           onChange={definirTexto('descricao')} />
          </Campo>
          <Campo id="logo" rotulo="Logo">
            <DropzoneImagem valor={form.logoUrl ?? ''} aoAlterar={definir('logoUrl')}
                            enviar={(arquivo) => enviarImagemLoja(tenant, arquivo)} />
          </Campo>
        </GradeCampos>
      </SecaoCrud>

      <Endereco endereco={enderecoDaLoja} aoAlterar={alterarEndereco} semComplemento />

      <SecaoCrud id="secao-entrega" titulo="Entrega">
        <GradeCampos>
          <Campo id="taxa-base" rotulo="Taxa de entrega base" tamanho={3}>
            <InputNumber inputId="taxa-base" value={form.taxaEntregaBase} min={0} {...moeda}
                         onValueChange={(e) => definir('taxaEntregaBase')(e.value ?? 0)} />
          </Campo>
          <Campo id="taxa-km" rotulo="Taxa por km" tamanho={3}>
            <InputNumber inputId="taxa-km" value={form.taxaEntregaPorKm} min={0} {...moeda}
                         onValueChange={(e) => definir('taxaEntregaPorKm')(e.value ?? 0)} />
          </Campo>
          <Campo id="distancia-maxima" rotulo="Distância máxima (km)" tamanho={3}>
            <InputNumber inputId="distancia-maxima" value={form.distanciaMaximaEntregaKm} min={0} maxFractionDigits={1}
                         onValueChange={(e) => definir('distanciaMaximaEntregaKm')(e.value)} />
          </Campo>
          <Campo id="valor-minimo" rotulo="Valor mínimo do pedido" tamanho={3}>
            <InputNumber inputId="valor-minimo" value={form.valorMinimoPedido} min={0} {...moeda}
                         onValueChange={(e) => definir('valorMinimoPedido')(e.value ?? 0)} />
          </Campo>
        </GradeCampos>
      </SecaoCrud>

      <SecaoCrud id="secao-funcionamento" titulo="Horário de funcionamento">
        <div className="opcoes-modo" role="radiogroup" aria-label="Modo de funcionamento">
          {MODOS_FUNCIONAMENTO.map((modo) => (
            <label key={modo.valor} className="opcoes-modo__item" htmlFor={`modo-${modo.valor}`}>
              <RadioButton inputId={`modo-${modo.valor}`} name="modo" value={modo.valor}
                           checked={funcionamento.modo === modo.valor}
                           onChange={(e) => setFuncionamento((atual) => ({ ...atual, modo: e.value }))} />
              <span>
                <strong>{modo.rotulo}</strong>
                <small className="campo__ajuda">{modo.descricao}</small>
              </span>
            </label>
          ))}
        </div>

        <p className="texto-auxiliar">
          Cada dia pode ter mais de um intervalo (ex.: almoço e jantar). Se o fechamento for antes da abertura, o
          intervalo termina no dia seguinte. Sem nenhum horário cadastrado, a loja é considerada sempre aberta.
        </p>
        <HorarioFuncionamento horarios={funcionamento.horarios}
                              aoAlterar={(horarios) => setFuncionamento((atual) => ({ ...atual, horarios }))} />
      </SecaoCrud>
    </>
  )

  return (
    <form onSubmit={handleSubmit}>
      <CrudPagina
        titulo="Minha loja"
        subtitulo="Dados, entrega e horário de funcionamento"
        ancoras={carregando || erro ? undefined : ANCORAS}
        rodape={(
          <div className="crud__acoes">
            <span className="crud__espaco" />
            <Button type="button" label="Fechar" severity="secondary" outlined onClick={() => navigate('/admin/dashboard')} />
            {pode('MINHA_LOJA_ALTERAR', 'MINHA_LOJA_HORARIO') && (
              <Button type="submit" label={salvando ? 'Salvando...' : 'Salvar alterações'} disabled={salvando || carregando || !!erro} />
            )}
          </div>
        )}
      >
        {carregando && <CrudSkeleton blocos={[[8, 4, 12, 12], [2, 6, 2, 4, 4, 4], [3, 3, 3, 3], [12, 12, 12]]} />}
        {erro && <p className="mensagem-erro">{erro}</p>}
        {conteudo}
      </CrudPagina>
    </form>
  )
}
