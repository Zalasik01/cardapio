import { useEffect, useRef, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { Dropdown } from 'primereact/dropdown'
import { InputMask } from 'primereact/inputmask'
import { InputText } from 'primereact/inputtext'
import { dispatchMsgError, dispatchMsgSuccess, dispatchMsgWarn } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import {
  atualizarLojaGestao, criarLojaGestao, excluirLojaGestao, obterLojaGestao,
} from '../../api/gestaoLojasApi'
import CrudPagina from '../../components/crud/CrudPagina'
import CampoAtivo from '../../components/crud/CampoAtivo'
import Endereco from '../../components/crud/Endereco'
import RodapeCrud from '../../components/crud/RodapeCrud'
import { Campo, GradeCampos, SecaoCrud } from '../../components/crud/Campo'
import SecaoMensalidades from '../../components/gestao/SecaoMensalidades'
import { FormularioSkeleton } from '../../components/Skeleton'
import { buscarEmpresaPorCnpj } from '../../api/cnpjApi'
import { formatarCnpj, soDigitos } from '../../utils/formatadores'
import { ENDERECO_VAZIO } from '../../utils/pessoa'
import { SITUACOES_CONTA, TIPOS_ORGANIZACAO } from '../../utils/loja'

const ROTA_LISTA = '/admin/gestao-lojas'

const ANCORAS = [
  { id: 'secao-principal', titulo: 'Principal' },
  { id: 'secao-endereco', titulo: 'Endereço' },
  { id: 'secao-mensalidades', titulo: 'Mensalidades' },
]

const FORM_VAZIO = {
  ativo: true,
  nome: '',
  slug: '',
  cnpj: '',
  tipoOrganizacao: 'RESTAURANTE',
  situacaoConta: 'TRIAL',
  descricao: '',
  telefone: '',
  logoUrl: '',
  endereco: ENDERECO_VAZIO,
  valorMensalidade: 0,
  diaVencimento: null,
}

/** O endereço da loja usa os mesmos campos do bloco Endereco (logradouro, número, complemento, bairro...). */
function paraFormulario(loja) {
  return {
    ativo: loja.ativo,
    nome: loja.nome,
    slug: loja.slug,
    cnpj: formatarCnpj(loja.cnpj),
    tipoOrganizacao: loja.tipoOrganizacao,
    situacaoConta: loja.situacaoConta,
    descricao: loja.descricao ?? '',
    telefone: loja.telefone ?? '',
    logoUrl: loja.logoUrl ?? '',
    endereco: {
      cep: loja.enderecoCep ?? '',
      logradouro: loja.enderecoRua ?? '',
      numero: loja.enderecoNumero ?? '',
      complemento: loja.enderecoComplemento ?? '',
      bairro: loja.enderecoBairro ?? '',
      cidade: loja.enderecoCidade ?? '',
      estado: loja.enderecoEstado ?? null,
    },
    valorMensalidade: loja.valorMensalidade ?? 0,
    diaVencimento: loja.diaVencimento,
  }
}

function paraRequisicao(form) {
  return {
    ativo: form.ativo,
    nome: form.nome,
    slug: form.slug,
    cnpj: soDigitos(form.cnpj),
    tipoOrganizacao: form.tipoOrganizacao,
    situacaoConta: form.situacaoConta,
    descricao: form.descricao,
    telefone: form.telefone,
    logoUrl: form.logoUrl,
    enderecoCep: form.endereco.cep,
    enderecoRua: form.endereco.logradouro,
    enderecoNumero: form.endereco.numero,
    enderecoComplemento: form.endereco.complemento,
    enderecoBairro: form.endereco.bairro,
    enderecoCidade: form.endereco.cidade,
    enderecoEstado: form.endereco.estado ?? '',
    valorMensalidade: form.valorMensalidade,
    diaVencimento: form.diaVencimento,
  }
}

/** "Pizzaria do Zé" -> "pizzaria-do-ze": sugestão de slug a partir do nome. */
function sugerirSlug(nome) {
  return nome
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

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
  const [buscandoCnpj, setBuscandoCnpj] = useState(false)
  const consultaCnpj = useRef(0) // ignora respostas de consultas antigas

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

  /** Ao completar o CNPJ de uma loja nova, preenche nome, endereço público (slug), telefone e endereço pela BrasilAPI. */
  async function preencherPorCnpj(cnpj) {
    const consulta = ++consultaCnpj.current
    setBuscandoCnpj(true)
    try {
      const empresa = await buscarEmpresaPorCnpj(cnpj)
      if (consulta !== consultaCnpj.current) return
      if (!empresa) {
        dispatchMsgWarn('CNPJ não encontrado na Receita. Preencha os dados manualmente.')
        return
      }
      const nome = empresa.nomeFantasia || empresa.razaoSocial
      const telefone = soDigitos(empresa.telefones[0])
      setForm((atual) => ({
        ...atual,
        nome: atual.nome || nome,
        slug: slugEditadoManualmente || atual.slug ? atual.slug : sugerirSlug(nome),
        descricao: atual.descricao || empresa.razaoSocial,
        telefone: atual.telefone || (telefone.length === 11 ? telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') : ''),
        endereco: { ...atual.endereco, ...empresa.endereco },
      }))
      if (empresa.situacao && empresa.situacao.toUpperCase() !== 'ATIVA') {
        dispatchMsgWarn(`Situação cadastral na Receita: ${empresa.situacao}`)
      }
    } catch {
      if (consulta === consultaCnpj.current) {
        dispatchMsgWarn('Não foi possível consultar o CNPJ agora. Preencha os dados manualmente.')
      }
    } finally {
      if (consulta === consultaCnpj.current) setBuscandoCnpj(false)
    }
  }

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
          <CampoAtivo valor={form.ativo} aoAlterar={definir('ativo')} rotulo="Ativa" />

          <Campo id="cnpj" rotulo="CNPJ" tamanho={4}
                 ajuda={buscandoCnpj ? 'Buscando dados da empresa...' : (editando ? undefined : 'Ao completar o CNPJ, os dados são buscados na BrasilAPI.')}>
            <InputMask id="cnpj" mask="99.999.999/9999-99" autoClear={false} value={form.cnpj}
                       onChange={(e) => definir('cnpj')(e.target.value ?? '')}
                       onComplete={editando ? undefined : (e) => preencherPorCnpj(e.value)} />
          </Campo>
          <Campo id="nome" rotulo="Nome" obrigatorio tamanho={4}>
            <InputText id="nome" required maxLength={255} value={form.nome} onChange={alterarNome} />
          </Campo>
          <Campo id="slug" rotulo="Endereço (slug)" obrigatorio tamanho={4}
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

      <Endereco endereco={form.endereco} aoAlterar={alterarEndereco} />

      <SecaoMensalidades
        lojaId={editando ? Number(id) : undefined}
        valorMensalidade={form.valorMensalidade}
        diaVencimento={form.diaVencimento}
        aoAlterarConfig={(campo, valor) => definir(campo)(valor)}
      />
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
          <RodapeCrud
            editando={editando}
            carregando={carregando}
            salvando={salvando}
            aoExcluir={handleExcluir}
            aoFechar={() => navigate(ROTA_LISTA)}
          />
        )}
      >
        {carregando ? <FormularioSkeleton campos={6} /> : conteudo}
      </CrudPagina>
    </form>
  )
}
