import { useEffect, useRef, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { AutoComplete } from 'primereact/autocomplete'
import { Checkbox } from 'primereact/checkbox'
import { Calendar } from 'primereact/calendar'
import { Dropdown } from 'primereact/dropdown'
import { MultiSelect } from 'primereact/multiselect'
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { useAuth } from '../../context/AuthContext'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import { buscarPessoas } from '../../api/pessoasApi'
import {
  atualizarProdutoCadastro, criarProdutoCadastro, excluirProdutoCadastro, listarCategoriasCadastro,
  codigoProdutoDisponivel, obterProdutoCadastro, obterProximoCodigo,
} from '../../api/produtosCadastroApi'
import DropzoneImagem from '../../components/DropzoneImagem'
import { enviarImagemLoja } from '../../api/adminApi'
import CampoAtivo from '../../components/crud/CampoAtivo'
import { Campo, GradeCampos, SecaoCrud } from '../../components/crud/Campo'
import CrudPagina from '../../components/crud/CrudPagina'
import RodapeCrud from '../../components/crud/RodapeCrud'
import ComposicaoProduto from '../../components/produto/ComposicaoProduto'
import { CrudSkeleton } from '../../components/Skeleton'
import { SELOS_PRODUTO, TIPOS_PRODUTO, UNIDADES_MEDIDA } from '../../utils/produto'
import { DIAS_SEMANA, dataParaHora, diasParaCsv, diasParaLista, horaParaData } from '../../utils/janela'

const moeda = { mode: 'currency', currency: 'BRL', locale: 'pt-BR' }

const FORM_VAZIO = {
  ativo: true,
  codigo: '',
  nome: '',
  descricao: '',
  unidadeMedida: 'UN',
  observacao: '',
  // produto final
  categoriaId: null,
  preco: 0,
  imagemUrl: '',
  tempoPreparoMinutos: null,
  precoPromocional: null,
  destaque: false,
  disponivelDias: [], disponivelDas: null, disponivelAte: null, selos: [], alergenos: '',
  promoDias: [], promoInicio: null, promoFim: null,
  disponivel: true,
  composicao: [],
  // ingrediente
  custoUnitario: 0,
  fornecedor: null, // { id, nome } ou o texto digitado
}

function paraFormulario(produto) {
  return {
    ativo: produto.ativo,
    codigo: produto.codigo ?? '',
    nome: produto.nome,
    descricao: produto.descricao ?? '',
    unidadeMedida: produto.unidadeMedida,
    observacao: produto.observacao ?? '',
    categoriaId: produto.categoriaId,
    preco: produto.preco ?? 0,
    imagemUrl: produto.imagemUrl ?? '',
    tempoPreparoMinutos: produto.tempoPreparoMinutos ?? null,
    precoPromocional: produto.precoPromocional ?? null,
    destaque: !!produto.destaque,
    disponivelDias: diasParaLista(produto.disponivelDias), disponivelDas: horaParaData(produto.disponivelDas), disponivelAte: horaParaData(produto.disponivelAte),
    selos: produto.selos ? produto.selos.split(',') : [], alergenos: produto.alergenos ?? '',
    promoDias: diasParaLista(produto.promoDias), promoInicio: horaParaData(produto.promoInicio), promoFim: horaParaData(produto.promoFim),
    disponivel: produto.disponivel,
    composicao: (produto.composicao ?? []).map((item) => ({ ...item, _id: `item-${item.ingredienteId}` })),
    custoUnitario: produto.custoUnitario ?? 0,
    fornecedor: produto.fornecedorId ? { id: produto.fornecedorId, nome: produto.fornecedorNome } : null,
  }
}

function paraRequisicao(form, tipo) {
  const comum = {
    tipo,
    ativo: form.ativo,
    codigo: form.codigo,
    nome: form.nome,
    descricao: form.descricao,
    unidadeMedida: form.unidadeMedida,
    observacao: form.observacao,
  }
  if (tipo === 'FINAL') {
    return {
      ...comum,
      categoriaId: form.categoriaId,
      preco: form.preco,
      imagemUrl: form.imagemUrl,
      tempoPreparoMinutos: form.tempoPreparoMinutos,
      precoPromocional: form.precoPromocional,
      destaque: form.destaque,
      disponivelDias: diasParaCsv(form.disponivelDias), disponivelDas: dataParaHora(form.disponivelDas), disponivelAte: dataParaHora(form.disponivelAte),
      selos: form.selos.length ? form.selos.join(',') : null, alergenos: form.alergenos.trim() || null,
      promoDias: diasParaCsv(form.promoDias), promoInicio: dataParaHora(form.promoInicio), promoFim: dataParaHora(form.promoFim),
      disponivel: form.disponivel,
      composicao: form.composicao.map(({ ingredienteId, quantidade }) => ({ ingredienteId, quantidade })),
    }
  }
  return { ...comum, custoUnitario: form.custoUnitario, fornecedorId: form.fornecedor?.id ?? null }
}

/** Esqueleto de cada tipo: o bloco Principal (e a Composição, no produto final). */
const ESQUELETO = {
  FINAL: [[3, 5, 4, 4, 4, 4, 12, 12], [12]],
  INGREDIENTE: [[3, 5, 4, 4, 4, 4, 12]],
}

/**
 * Cadastro de produto, nos dois tipos: produto final (categoria, preço, imagem, composição de ingredientes)
 * e ingrediente (custo por unidade e fornecedor). Rotas /admin/produtos-finais/... e /admin/ingredientes/...
 */
export default function PaginaProdutoCadastroCrud({ tipo }) {
  const { id } = useParams()
  const editando = id !== undefined
  const config = TIPOS_PRODUTO[tipo]
  const modulo = tipo === 'FINAL' ? 'PRODUTOS_FINAIS' : 'INGREDIENTES'
  const { loja, pode } = useAuth()
  const navigate = useNavigate()
  const { definirMigalha } = useOutletContext()

  const [form, setForm] = useState(FORM_VAZIO)
  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)
  const [categorias, setCategorias] = useState([])
  const [sugestoesFornecedor, setSugestoesFornecedor] = useState([])
  const [erroCodigo, setErroCodigo] = useState(null)
  const consultaCodigo = useRef(0) // ignora respostas de consultas antigas

  useEffect(() => {
    definirMigalha(editando ? `Editando ${config.singular}` : config.novo)
    return () => definirMigalha(null)
  }, [editando, config, definirMigalha])

  useEffect(() => {
    if (tipo === 'FINAL') listarCategoriasCadastro(loja.tenant).then(setCategorias).catch(() => setCategorias([]))
  }, [tipo, loja.tenant])

  // produto novo: o código já vem preenchido com o próximo da sequência (pode ser alterado)
  useEffect(() => {
    if (editando) return
    obterProximoCodigo(loja.tenant)
      .then((codigo) => setForm((atual) => (atual.codigo ? atual : { ...atual, codigo })))
      .catch(() => {}) // sem a sugestão o código fica em branco e o servidor gera um ao salvar
  }, [editando, loja.tenant])

  useEffect(() => {
    if (!editando) return
    setCarregando(true)
    obterProdutoCadastro(loja.tenant, id)
      .then((produto) => setForm(paraFormulario(produto)))
      .catch((e) => dispatchMsgError(e.mensagem))
      .finally(() => setCarregando(false))
  }, [editando, id, loja.tenant])

  // valida o código assim que ele muda (com uma pequena espera enquanto digita)
  useEffect(() => {
    if (carregando || !form.codigo.trim()) {
      setErroCodigo(null)
      return undefined
    }
    const consulta = ++consultaCodigo.current
    const espera = setTimeout(() => {
      codigoProdutoDisponivel(loja.tenant, form.codigo.trim(), editando ? Number(id) : undefined)
        .then((livre) => consulta === consultaCodigo.current && setErroCodigo(livre ? null : 'Este código já está em uso por outro produto.'))
        .catch(() => consulta === consultaCodigo.current && setErroCodigo(null)) // sem a consulta, o servidor valida ao salvar
    }, 350)
    return () => clearTimeout(espera)
  }, [form.codigo, carregando, editando, id, loja.tenant])

  const definir = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }))
  const definirTexto = (campo) => (e) => definir(campo)(e.target.value)

  function buscarFornecedores(evento) {
    buscarPessoas(loja.tenant, { busca: evento.query, papel: 'FORNECEDOR', size: 10 })
      .then((resposta) => setSugestoesFornecedor(resposta.content))
      .catch(() => setSugestoesFornecedor([]))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (erroCodigo) {
      dispatchMsgError(erroCodigo)
      return
    }
    setSalvando(true)
    try {
      if (editando) {
        await atualizarProdutoCadastro(loja.tenant, id, paraRequisicao(form, tipo))
        dispatchMsgSuccess('Cadastro atualizado com sucesso')
      } else {
        await criarProdutoCadastro(loja.tenant, paraRequisicao(form, tipo))
        dispatchMsgSuccess('Cadastro criado com sucesso')
        navigate(config.rota)
      }
    } catch (e2) {
      dispatchMsgError(e2.mensagem)
    } finally {
      setSalvando(false)
    }
  }

  function handleExcluir() {
    confirmar({
      mensagem: `Excluir este ${config.singular}? Essa ação não pode ser desfeita.`,
      aoConfirmar: async () => {
        try {
          await excluirProdutoCadastro(loja.tenant, id)
          dispatchMsgSuccess('Cadastro excluído com sucesso')
          navigate(config.rota)
        } catch (e) {
          dispatchMsgError(e.mensagem)
        }
      },
    })
  }

  const final = tipo === 'FINAL'
  const ancoras = final
    ? [{ id: 'secao-principal', titulo: 'Principal' }, { id: 'secao-composicao', titulo: 'Composição' }]
    : undefined

  const conteudo = (
    <>
      <SecaoCrud id="secao-principal" titulo="Principal">
        <GradeCampos>
          <CampoAtivo valor={form.ativo} aoAlterar={definir('ativo')} />

          <Campo id="codigo" rotulo="Código" tamanho={3} erro={erroCodigo}>
            <InputText id="codigo" maxLength={50} value={form.codigo} onChange={definirTexto('codigo')}
                       className={erroCodigo ? 'p-invalid' : undefined} aria-invalid={!!erroCodigo} />
          </Campo>
          <Campo id="nome" rotulo="Nome" obrigatorio tamanho={5}>
            <InputText id="nome" required maxLength={255} value={form.nome} onChange={definirTexto('nome')} />
          </Campo>
          <Campo id="unidade" rotulo={final ? 'Unidade de venda' : 'Unidade de medida'} obrigatorio tamanho={4}>
            <Dropdown inputId="unidade" value={form.unidadeMedida} options={UNIDADES_MEDIDA} optionLabel="rotulo"
                      optionValue="valor" onChange={(e) => definir('unidadeMedida')(e.value)} />
          </Campo>

          {final ? (
            <>
              <Campo id="categoria" rotulo="Categoria do cardápio" obrigatorio tamanho={4}>
                <Dropdown inputId="categoria" value={form.categoriaId} options={categorias} optionLabel="nome" optionValue="id"
                          placeholder="Selecione" filter onChange={(e) => definir('categoriaId')(e.value)} />
              </Campo>
              <Campo id="preco" rotulo="Preço de venda" obrigatorio tamanho={4}>
                <InputNumber inputId="preco" value={form.preco} min={0} {...moeda}
                             onValueChange={(e) => definir('preco')(e.value ?? 0)} />
              </Campo>
              <Campo id="preco-promocional" rotulo="Preço promocional" tamanho={4}
                     ajuda="Opcional. Aparece riscado o preço normal e vale nos novos pedidos.">
                <InputNumber inputId="preco-promocional" value={form.precoPromocional} min={0} {...moeda}
                             onValueChange={(e) => definir('precoPromocional')(e.value ?? null)} />
              </Campo>
              <div className="campo campo--4 campo--linha">
                <span className="campo-checkbox">
                  <Checkbox inputId="destaque" checked={form.destaque} onChange={(e) => definir('destaque')(e.checked)} />
                  <label htmlFor="destaque">Destacar no cardápio online</label>
                </span>
              </div>
              <div className="campo campo--4 campo--linha">
                <span className="campo-checkbox">
                  <Checkbox inputId="disponivel" checked={form.disponivel} onChange={(e) => definir('disponivel')(e.checked)} />
                  <label htmlFor="disponivel">Disponível no cardápio</label>
                </span>
              </div>
              <Campo id="tempo-preparo" rotulo="Tempo de preparo (min)" tamanho={4}
                     ajuda="Vazio = usa o da categoria ou o padrão da loja.">
                <InputNumber inputId="tempo-preparo" value={form.tempoPreparoMinutos} min={1} useGrouping={false}
                             onValueChange={(e) => definir('tempoPreparoMinutos')(e.value ?? null)} />
              </Campo>
              <Campo id="imagem" rotulo="Imagem">
                <DropzoneImagem valor={form.imagemUrl} aoAlterar={definir('imagemUrl')}
                                enviar={(arquivo) => enviarImagemLoja(loja.tenant, arquivo)} />
              </Campo>
              <Campo id="descricao" rotulo="Descrição (aparece no cardápio)">
                <InputTextarea id="descricao" rows={3} maxLength={1000} autoResize value={form.descricao}
                               onChange={definirTexto('descricao')} />
              </Campo>
            </>
          ) : (
            <>
              <Campo id="custo" rotulo={`Custo por unidade`} obrigatorio tamanho={4}
                     ajuda="Quanto custa 1 unidade de medida do ingrediente.">
                <InputNumber inputId="custo" value={form.custoUnitario} min={0} minFractionDigits={2} maxFractionDigits={4} {...moeda}
                             onValueChange={(e) => definir('custoUnitario')(e.value ?? 0)} />
              </Campo>
              <Campo id="fornecedor" rotulo="Fornecedor" tamanho={8} ajuda="Pessoa cadastrada como fornecedor em Clientes e Fornecedores.">
                <AutoComplete
                  inputId="fornecedor"
                  value={form.fornecedor}
                  suggestions={sugestoesFornecedor}
                  completeMethod={buscarFornecedores}
                  field="nome"
                  dropdown
                  forceSelection
                  delay={300}
                  placeholder="Digite para buscar"
                  onChange={(e) => definir('fornecedor')(e.value || null)}
                />
              </Campo>
            </>
          )}

          <Campo id="observacao" rotulo="Observação">
            <InputTextarea id="observacao" rows={3} maxLength={2000} autoResize value={form.observacao}
                           onChange={definirTexto('observacao')} />
          </Campo>
        </GradeCampos>
      </SecaoCrud>

      {final && (
        <SecaoCrud id="secao-venda" titulo="Venda e promoção">
          <GradeCampos>
            <Campo id="disponivelDias" rotulo="Vende nos dias" tamanho={4} ajuda="Vazio = todos os dias.">
              <MultiSelect inputId="disponivelDias" value={form.disponivelDias} options={DIAS_SEMANA} optionLabel="rotulo" optionValue="valor"
                           display="chip" placeholder="Todos os dias" onChange={(e) => definir('disponivelDias')(e.value)} />
            </Campo>
            <Campo id="disponivelDas" rotulo="Vende a partir de" tamanho={2} ajuda="Ex.: almoço 11:00.">
              <Calendar inputId="disponivelDas" value={form.disponivelDas} timeOnly hourFormat="24" onChange={(e) => definir('disponivelDas')(e.value)} />
            </Campo>
            <Campo id="disponivelAte" rotulo="Vende até" tamanho={2}>
              <Calendar inputId="disponivelAte" value={form.disponivelAte} timeOnly hourFormat="24" onChange={(e) => definir('disponivelAte')(e.value)} />
            </Campo>
            <Campo id="promoDias" rotulo="Promoção nos dias" tamanho={4} ajuda="Só vale com preço promocional. Vazio = todos os dias.">
              <MultiSelect inputId="promoDias" value={form.promoDias} options={DIAS_SEMANA} optionLabel="rotulo" optionValue="valor"
                           display="chip" placeholder="Todos os dias" onChange={(e) => definir('promoDias')(e.value)} />
            </Campo>
            <Campo id="promoInicio" rotulo="Promoção das" tamanho={2} ajuda="Happy hour: ex. 17:00.">
              <Calendar inputId="promoInicio" value={form.promoInicio} timeOnly hourFormat="24" onChange={(e) => definir('promoInicio')(e.value)} />
            </Campo>
            <Campo id="promoFim" rotulo="Promoção até" tamanho={2}>
              <Calendar inputId="promoFim" value={form.promoFim} timeOnly hourFormat="24" onChange={(e) => definir('promoFim')(e.value)} />
            </Campo>
            <Campo id="selos" rotulo="Selos" tamanho={6}>
              <MultiSelect inputId="selos" value={form.selos} options={SELOS_PRODUTO} optionLabel="rotulo" optionValue="valor"
                           display="chip" placeholder="Nenhum" onChange={(e) => definir('selos')(e.value)} />
            </Campo>
            <Campo id="alergenos" rotulo="Alérgenos" tamanho={6} ajuda="Aparece no detalhe do produto. Ex.: Contém glúten e leite.">
              <InputText id="alergenos" maxLength={300} value={form.alergenos} onChange={(e) => definir('alergenos')(e.target.value)} />
            </Campo>
          </GradeCampos>
        </SecaoCrud>
      )}

      {final && (
        <ComposicaoProduto itens={form.composicao} preco={form.preco} aoAlterar={definir('composicao')} />
      )}
    </>
  )

  return (
    <form onSubmit={handleSubmit}>
      <CrudPagina
        somenteLeitura={!pode(editando ? `${modulo}_ALTERAR` : `${modulo}_INCLUIR`)}
        titulo={editando ? (carregando ? 'Produto' : form.nome) : config.novo}
        subtitulo={editando ? `Editar ${config.singular}` : `Cadastro de ${config.singular}`}
        aoVoltar={() => navigate(config.rota)}
        ancoras={carregando ? undefined : ancoras}
        rodape={(
          <RodapeCrud
            editando={editando}
            carregando={carregando}
            salvando={salvando}
            aoExcluir={handleExcluir}
            podeExcluir={pode(`${modulo}_EXCLUIR`)} podeSalvar={pode(editando ? `${modulo}_ALTERAR` : `${modulo}_INCLUIR`)}
            aoFechar={() => navigate(config.rota)}
          />
        )}
      >
        {carregando ? <CrudSkeleton blocos={ESQUELETO[tipo]} /> : conteudo}
      </CrudPagina>
    </form>
  )
}
