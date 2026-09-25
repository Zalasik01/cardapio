import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { AutoComplete } from 'primereact/autocomplete'
import { Checkbox } from 'primereact/checkbox'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { useAuth } from '../../context/AuthContext'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import { buscarPessoas } from '../../api/pessoasApi'
import {
  atualizarProdutoCadastro, criarProdutoCadastro, excluirProdutoCadastro, listarCategoriasCadastro,
  obterProdutoCadastro, obterProximoCodigo,
} from '../../api/produtosCadastroApi'
import CampoAtivo from '../../components/crud/CampoAtivo'
import { Campo, GradeCampos, SecaoCrud } from '../../components/crud/Campo'
import CrudPagina from '../../components/crud/CrudPagina'
import RodapeCrud from '../../components/crud/RodapeCrud'
import ComposicaoProduto from '../../components/produto/ComposicaoProduto'
import { CrudSkeleton } from '../../components/Skeleton'
import { TIPOS_PRODUTO, UNIDADES_MEDIDA } from '../../utils/produto'

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
  const { loja } = useAuth()
  const navigate = useNavigate()
  const { definirMigalha } = useOutletContext()

  const [form, setForm] = useState(FORM_VAZIO)
  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)
  const [categorias, setCategorias] = useState([])
  const [sugestoesFornecedor, setSugestoesFornecedor] = useState([])

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

  const definir = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }))
  const definirTexto = (campo) => (e) => definir(campo)(e.target.value)

  function buscarFornecedores(evento) {
    buscarPessoas(loja.tenant, { busca: evento.query, papel: 'FORNECEDOR', size: 10 })
      .then((resposta) => setSugestoesFornecedor(resposta.content))
      .catch(() => setSugestoesFornecedor([]))
  }

  async function handleSubmit(e) {
    e.preventDefault()
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
      mensagem: `Excluir este ${config.singular}?`,
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

          <Campo id="codigo" rotulo="Código" tamanho={3} ajuda={editando ? undefined : 'Sugerido em sequência; pode alterar (único por loja).'}>
            <InputText id="codigo" maxLength={50} value={form.codigo} onChange={definirTexto('codigo')} />
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
              <div className="campo campo--4 campo--linha">
                <span className="campo-checkbox">
                  <Checkbox inputId="disponivel" checked={form.disponivel} onChange={(e) => definir('disponivel')(e.checked)} />
                  <label htmlFor="disponivel">Disponível no cardápio</label>
                </span>
              </div>
              <Campo id="imagem" rotulo="Imagem (URL)">
                <InputText id="imagem" maxLength={255} value={form.imagemUrl} onChange={definirTexto('imagemUrl')} />
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
        <ComposicaoProduto itens={form.composicao} preco={form.preco} aoAlterar={definir('composicao')} />
      )}
    </>
  )

  return (
    <form onSubmit={handleSubmit}>
      <CrudPagina
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
            aoFechar={() => navigate(config.rota)}
          />
        )}
      >
        {carregando ? <CrudSkeleton blocos={ESQUELETO[tipo]} /> : conteudo}
      </CrudPagina>
    </form>
  )
}
