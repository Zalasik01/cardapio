import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { Button } from 'primereact/button'
import { Checkbox } from 'primereact/checkbox'
import { Dropdown } from 'primereact/dropdown'
import { InputMask } from 'primereact/inputmask'
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import {
  atualizarLojaGestao, criarLojaGestao, excluirLojaGestao, obterLojaGestao,
} from '../../api/gestaoLojasApi'
import CrudPagina from '../../components/crud/CrudPagina'
import { Campo, GradeCampos, SecaoCrud } from '../../components/crud/Campo'
import SecaoEndereco from '../../components/crud/SecaoEndereco'
import { FormularioSkeleton } from '../../components/Skeleton'
import { ENDERECO_VAZIO } from '../../utils/pessoa'
import { SITUACOES_CONTA, TIPOS_ORGANIZACAO } from '../../utils/loja'

const ROTA_LISTA = '/admin/gestao-lojas'

const ANCORAS = [
  { id: 'secao-principal', titulo: 'Principal' },
  { id: 'secao-endereco', titulo: 'Endereço' },
  { id: 'secao-entrega', titulo: 'Entrega' },
]

const FORM_VAZIO = {
  ativo: true,
  nome: '',
  slug: '',
  tipoOrganizacao: 'RESTAURANTE',
  situacaoConta: 'TRIAL',
  descricao: '',
  telefone: '',
  logoUrl: '',
  endereco: ENDERECO_VAZIO,
  latitude: null,
  longitude: null,
  taxaEntregaBase: 0,
  taxaEntregaPorKm: 0,
  distanciaMaximaEntregaKm: null,
  valorMinimoPedido: 0,
}

/** O endereço da loja usa os mesmos campos do SecaoEndereco (logradouro, número, bairro...). */
function paraFormulario(loja) {
  return {
    ativo: loja.ativo,
    nome: loja.nome,
    slug: loja.slug,
    tipoOrganizacao: loja.tipoOrganizacao,
    situacaoConta: loja.situacaoConta,
    descricao: loja.descricao ?? '',
    telefone: loja.telefone ?? '',
    logoUrl: loja.logoUrl ?? '',
    endereco: {
      cep: loja.enderecoCep ?? '',
      logradouro: loja.enderecoRua ?? '',
      numero: loja.enderecoNumero ?? '',
      complemento: '',
      bairro: loja.enderecoBairro ?? '',
      cidade: loja.enderecoCidade ?? '',
      estado: loja.enderecoEstado ?? null,
    },
    latitude: loja.latitude,
    longitude: loja.longitude,
    taxaEntregaBase: loja.taxaEntregaBase ?? 0,
    taxaEntregaPorKm: loja.taxaEntregaPorKm ?? 0,
    distanciaMaximaEntregaKm: loja.distanciaMaximaEntregaKm,
    valorMinimoPedido: loja.valorMinimoPedido ?? 0,
  }
}

function paraRequisicao(form) {
  return {
    ativo: form.ativo,
    nome: form.nome,
    slug: form.slug,
    tipoOrganizacao: form.tipoOrganizacao,
    situacaoConta: form.situacaoConta,
    descricao: form.descricao,
    telefone: form.telefone,
    logoUrl: form.logoUrl,
    enderecoCep: form.endereco.cep,
    enderecoRua: form.endereco.logradouro,
    enderecoNumero: form.endereco.numero,
    enderecoBairro: form.endereco.bairro,
    enderecoCidade: form.endereco.cidade,
    enderecoEstado: form.endereco.estado ?? '',
    latitude: form.latitude,
    longitude: form.longitude,
    taxaEntregaBase: form.taxaEntregaBase,
    taxaEntregaPorKm: form.taxaEntregaPorKm,
    distanciaMaximaEntregaKm: form.distanciaMaximaEntregaKm,
    valorMinimoPedido: form.valorMinimoPedido,
  }
}

/** "Pizzaria do Zé" -> "pizzaria-do-ze": sugestão de slug a partir do nome. */
function sugerirSlug(nome) {
  return nome
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

const moeda = { mode: 'currency', currency: 'BRL', locale: 'pt-BR' }

/** Cadastro de loja: /admin/gestao-lojas/novo e /admin/gestao-lojas/:id. */
export default function PaginaGestaoLojaCrud() {
  const { id } = useParams()
  const editando = id !== undefined
  const navigate = useNavigate()
  const { definirMigalha } = useOutletContext()

  const [form, setForm] = useState(FORM_VAZIO)
  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(editando)

  useEffect(() => {
    definirMigalha(editando ? 'Editando loja' : 'Nova loja')
    return () => definirMigalha(null)
  }, [editando, definirMigalha])

  useEffect(() => {
    if (!editando) return
    setCarregando(true)
    obterLojaGestao(id)
      .then((loja) => setForm(paraFormulario(loja)))
      .catch((e) => dispatchMsgError(e.mensagem))
      .finally(() => setCarregando(false))
  }, [editando, id])

  const definir = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }))
  const definirTexto = (campo) => (e) => definir(campo)(e.target.value)
  const alterarEndereco = (campos) => setForm((atual) => ({
    ...atual,
    endereco: { ...atual.endereco, ...(typeof campos === 'function' ? campos(atual.endereco) : campos) },
  }))

  /** Ao digitar o nome de uma loja nova, o slug acompanha até ser editado à mão. */
  function alterarNome(e) {
    const nome = e.target.value
    setForm((atual) => ({ ...atual, nome, slug: slugEditadoManualmente ? atual.slug : sugerirSlug(nome) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSalvando(true)
    try {
      if (editando) {
        await atualizarLojaGestao(id, paraRequisicao(form))
        dispatchMsgSuccess('Loja atualizada com sucesso')
      } else {
        await criarLojaGestao(paraRequisicao(form))
        dispatchMsgSuccess('Loja criada com sucesso')
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
      mensagem: 'Excluir esta loja?',
      aoConfirmar: async () => {
        try {
          await excluirLojaGestao(id)
          dispatchMsgSuccess('Loja excluída com sucesso')
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
          <div className="campo campo--12 campo--linha">
            <span className="campo-checkbox">
              <Checkbox inputId="ativo" checked={form.ativo} onChange={(e) => definir('ativo')(e.checked)} />
              <label htmlFor="ativo">Ativa</label>
            </span>
          </div>

          <Campo id="nome" rotulo="Nome" obrigatorio tamanho={6}>
            <InputText id="nome" required maxLength={255} value={form.nome} onChange={alterarNome} />
          </Campo>
          <Campo id="slug" rotulo="Endereço (slug)" obrigatorio tamanho={6}
                 ajuda="Endereço público da loja: só letras minúsculas, números e hífens.">
            <InputText id="slug" required maxLength={255} value={form.slug}
                       onChange={(e) => { setSlugEditadoManualmente(true); definir('slug')(e.target.value) }} />
          </Campo>

          <Campo id="tipo-organizacao" rotulo="Tipo de organização" obrigatorio tamanho={4}>
            <Dropdown inputId="tipo-organizacao" value={form.tipoOrganizacao} options={TIPOS_ORGANIZACAO}
                      optionLabel="rotulo" optionValue="valor" onChange={(e) => definir('tipoOrganizacao')(e.value)} />
          </Campo>
          <Campo id="situacao-conta" rotulo="Situação da conta" obrigatorio tamanho={4}>
            <Dropdown inputId="situacao-conta" value={form.situacaoConta} options={SITUACOES_CONTA}
                      optionLabel="rotulo" optionValue="valor" onChange={(e) => definir('situacaoConta')(e.value)} />
          </Campo>
          <Campo id="telefone" rotulo="Telefone" tamanho={4}>
            <InputMask id="telefone" mask="(99) 99999-9999" autoClear={false} value={form.telefone}
                       onChange={(e) => definir('telefone')(e.target.value ?? '')} />
          </Campo>

          <Campo id="descricao" rotulo="Descrição">
            <InputText id="descricao" maxLength={255} value={form.descricao} onChange={definirTexto('descricao')} />
          </Campo>
          <Campo id="logo" rotulo="Endereço da logo (URL)">
            <InputText id="logo" maxLength={255} value={form.logoUrl} onChange={definirTexto('logoUrl')} />
          </Campo>
        </GradeCampos>
      </SecaoCrud>

      <SecaoEndereco endereco={form.endereco} aoAlterar={alterarEndereco} comComplemento={false} />

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
          <Campo id="valor-minimo" rotulo="Valor mínimo do pedido" tamanho={3}>
            <InputNumber inputId="valor-minimo" value={form.valorMinimoPedido} min={0} {...moeda}
                         onValueChange={(e) => definir('valorMinimoPedido')(e.value ?? 0)} />
          </Campo>
          <Campo id="distancia-maxima" rotulo="Distância máxima (km)" tamanho={3}>
            <InputNumber inputId="distancia-maxima" value={form.distanciaMaximaEntregaKm} min={0} maxFractionDigits={1}
                         onValueChange={(e) => definir('distanciaMaximaEntregaKm')(e.value)} />
          </Campo>
          <Campo id="latitude" rotulo="Latitude" tamanho={3}>
            <InputNumber inputId="latitude" value={form.latitude} minFractionDigits={0} maxFractionDigits={7} useGrouping={false}
                         onValueChange={(e) => definir('latitude')(e.value)} />
          </Campo>
          <Campo id="longitude" rotulo="Longitude" tamanho={3}>
            <InputNumber inputId="longitude" value={form.longitude} minFractionDigits={0} maxFractionDigits={7} useGrouping={false}
                         onValueChange={(e) => definir('longitude')(e.value)} />
          </Campo>
        </GradeCampos>
      </SecaoCrud>
    </>
  )

  return (
    <form onSubmit={handleSubmit}>
      <CrudPagina
        titulo={editando ? (carregando ? 'Loja' : form.nome) : 'Nova loja'}
        subtitulo={editando ? 'Editar loja' : 'Cadastro de loja'}
        aoVoltar={() => navigate(ROTA_LISTA)}
        ancoras={carregando ? undefined : ANCORAS}
        rodape={(
          <div className="crud__acoes">
            {editando && (
              <Button type="button" label="Excluir" icon="pi pi-trash" severity="danger" outlined
                      disabled={carregando} onClick={handleExcluir} />
            )}
            <span className="crud__espaco" />
            <Button type="button" label="Fechar" severity="secondary" outlined onClick={() => navigate(ROTA_LISTA)} />
            <Button type="submit" label={salvando ? 'Salvando...' : 'Salvar alterações'} disabled={salvando || carregando} />
          </div>
        )}
      >
        {carregando ? <FormularioSkeleton campos={6} /> : conteudo}
      </CrudPagina>
    </form>
  )
}
