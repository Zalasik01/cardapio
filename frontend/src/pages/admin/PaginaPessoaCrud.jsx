import { useEffect, useRef, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { Calendar } from 'primereact/calendar'
import { Checkbox } from 'primereact/checkbox'
import { Dropdown } from 'primereact/dropdown'
import { InputMask } from 'primereact/inputmask'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { RadioButton } from 'primereact/radiobutton'
import { useAuth } from '../../context/AuthContext'
import { dispatchMsgError, dispatchMsgSuccess, dispatchMsgWarn } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import { buscarEmpresaPorCnpj } from '../../api/cnpjApi'
import {
  atualizarPessoa, consultarPessoaPorCpf, criarPessoa, excluirPessoa, obterPessoa,
} from '../../api/pessoasApi'
import CrudPagina from '../../components/crud/CrudPagina'
import CampoAtivo from '../../components/crud/CampoAtivo'
import Endereco from '../../components/crud/Endereco'
import RodapeCrud from '../../components/crud/RodapeCrud'
import { Campo, GradeCampos, SecaoCrud } from '../../components/crud/Campo'
import DialogoCpfExistente from '../../components/crud/DialogoCpfExistente'
import Contatos from '../../components/crud/Contatos'
import { CrudSkeleton } from '../../components/Skeleton'
import { dataParaIso, formatarCnpj, formatarCpf, isoParaData, soDigitos } from '../../utils/formatadores'
import {
  emailsParaFormulario, emailsParaRequisicao, ENDERECO_VAZIO, enderecoParaFormulario, enderecoParaRequisicao,
  ESTADOS_CIVIS, mesclarContatosDaEmpresa, SEXOS, telefonesParaFormulario, telefonesParaRequisicao,
} from '../../utils/pessoa'

const ROTA_LISTA = '/admin/pessoas'

const ANCORAS = [
  { id: 'secao-principal', titulo: 'Principal' },
  { id: 'secao-endereco', titulo: 'Endereço' },
  { id: 'secao-contatos', titulo: 'Contatos' },
]

const FORM_VAZIO = {
  tipo: 'FISICA',
  ativo: true,
  cliente: true,
  fornecedor: false,
  observacao: '',
  // pessoa física
  nome: '',
  apelido: '',
  cpf: '',
  rg: '',
  sexo: null,
  dataNascimento: null,
  estadoCivil: null,
  profissao: '',
  // pessoa jurídica
  razaoSocial: '',
  nomeFantasia: '',
  cnpj: '',
  inscricaoEstadual: '',
  inscricaoMunicipal: '',
  endereco: ENDERECO_VAZIO,
  telefones: [],
  emails: [],
}

function paraFormulario(pessoa) {
  return {
    tipo: pessoa.tipo,
    ativo: pessoa.ativo,
    cliente: pessoa.cliente,
    fornecedor: pessoa.fornecedor,
    observacao: pessoa.observacao ?? '',
    nome: pessoa.nome ?? '',
    apelido: pessoa.apelido ?? '',
    cpf: formatarCpf(pessoa.cpf),
    rg: pessoa.rg ?? '',
    sexo: pessoa.sexo,
    dataNascimento: isoParaData(pessoa.dataNascimento),
    estadoCivil: pessoa.estadoCivil,
    profissao: pessoa.profissao ?? '',
    razaoSocial: pessoa.razaoSocial ?? '',
    nomeFantasia: pessoa.nomeFantasia ?? '',
    cnpj: formatarCnpj(pessoa.cnpj),
    inscricaoEstadual: pessoa.inscricaoEstadual ?? '',
    inscricaoMunicipal: pessoa.inscricaoMunicipal ?? '',
    endereco: enderecoParaFormulario(pessoa.endereco),
    telefones: telefonesParaFormulario(pessoa.telefones),
    emails: emailsParaFormulario(pessoa.emails),
  }
}

function paraRequisicao(form) {
  return {
    tipo: form.tipo,
    ativo: form.ativo,
    cliente: form.cliente,
    fornecedor: form.fornecedor,
    observacao: form.observacao,
    nome: form.nome,
    apelido: form.apelido,
    cpf: soDigitos(form.cpf),
    rg: form.rg,
    sexo: form.sexo,
    dataNascimento: dataParaIso(form.dataNascimento),
    estadoCivil: form.estadoCivil,
    profissao: form.profissao,
    razaoSocial: form.razaoSocial,
    nomeFantasia: form.nomeFantasia,
    cnpj: soDigitos(form.cnpj),
    inscricaoEstadual: form.inscricaoEstadual,
    inscricaoMunicipal: form.inscricaoMunicipal,
    endereco: enderecoParaRequisicao(form.endereco),
    telefones: telefonesParaRequisicao(form.telefones),
    emails: emailsParaRequisicao(form.emails),
  }
}

/** Cadastro de cliente/fornecedor: /admin/pessoas/novo e /admin/pessoas/:id. */
export default function PaginaPessoaCrud() {
  const { id } = useParams()
  const editando = id !== undefined
  const { loja, pode } = useAuth()
  const navigate = useNavigate()
  const { definirMigalha } = useOutletContext()

  const [form, setForm] = useState(FORM_VAZIO)
  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)
  const [buscandoCnpj, setBuscandoCnpj] = useState(false)
  const consultaCnpj = useRef(0) // ignora respostas de consultas antigas
  const [cpfExistente, setCpfExistente] = useState(null) // pessoa que já usa o CPF digitado

  const fisica = form.tipo === 'FISICA'

  useEffect(() => {
    definirMigalha(editando ? 'Editando cadastro' : 'Novo cadastro')
    return () => definirMigalha(null)
  }, [editando, definirMigalha])

  useEffect(() => {
    if (!editando) return
    setCarregando(true)
    obterPessoa(loja.tenant, id)
      .then((pessoa) => setForm(paraFormulario(pessoa)))
      .catch((e) => dispatchMsgError(e.mensagem))
      .finally(() => setCarregando(false))
  }, [editando, id, loja.tenant])

  const definir = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }))
  const definirTexto = (campo) => (e) => definir(campo)(e.target.value)
  const alterarEndereco = (campos) => setForm((atual) => ({
    ...atual,
    endereco: { ...atual.endereco, ...(typeof campos === 'function' ? campos(atual.endereco) : campos) },
  }))
  const alterarContatos = (lista, novaLista) => setForm((atual) => ({ ...atual, [lista]: novaLista }))

  /** Ao completar o CPF, verifica se a pessoa já existe na loja (ex.: é funcionário). */
  async function verificarCpf(cpf) {
    try {
      setCpfExistente(await consultarPessoaPorCpf(loja.tenant, cpf))
    } catch {
      // sem a consulta o cadastro segue normal; o servidor também trata o CPF repetido ao salvar
    }
  }

  /** Assume os dados do cadastro existente: ao salvar, o servidor atualiza essa mesma pessoa. */
  function usarCadastroExistente() {
    const e = cpfExistente
    setForm((atual) => ({
      ...atual,
      cpf: formatarCpf(e.cpf),
      nome: e.nome ?? '',
      apelido: e.apelido ?? '',
      rg: e.rg ?? '',
      sexo: e.sexo,
      dataNascimento: isoParaData(e.dataNascimento),
      estadoCivil: e.estadoCivil,
      profissao: e.profissao ?? '',
      observacao: e.observacao ?? '',
      endereco: enderecoParaFormulario(e.endereco),
      telefones: telefonesParaFormulario(e.telefones),
      emails: emailsParaFormulario(e.emails),
    }))
    setCpfExistente(null)
  }

  function cancelarCpfExistente() {
    setCpfExistente(null)
    setForm((atual) => ({ ...atual, cpf: '' }))
  }

  /** Ao completar o CNPJ, busca razão social, fantasia, endereço e contatos na BrasilAPI. */
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
      setForm((atual) => {
        return {
          ...atual,
          razaoSocial: empresa.razaoSocial || atual.razaoSocial,
          nomeFantasia: empresa.nomeFantasia || atual.nomeFantasia,
          endereco: { ...atual.endereco, ...empresa.endereco },
          ...mesclarContatosDaEmpresa(atual.telefones, atual.emails, empresa),
        }
      })
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

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.cliente && !form.fornecedor) {
      dispatchMsgWarn('Marque se o cadastro é de cliente, fornecedor ou os dois.')
      return
    }
    setSalvando(true)
    try {
      if (editando) {
        await atualizarPessoa(loja.tenant, id, paraRequisicao(form))
        dispatchMsgSuccess('Cadastro atualizado com sucesso')
      } else {
        await criarPessoa(loja.tenant, paraRequisicao(form))
        dispatchMsgSuccess('Cadastro criado com sucesso')
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
      mensagem: 'Excluir este cadastro?',
      aoConfirmar: async () => {
        try {
          await excluirPessoa(loja.tenant, id)
          dispatchMsgSuccess('Cadastro excluído com sucesso')
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

          <Campo rotulo="Tipo de pessoa" tamanho={4}>
            <div className="opcoes-radio" role="radiogroup" aria-label="Tipo de pessoa">
              {[{ valor: 'FISICA', rotulo: 'Física' }, { valor: 'JURIDICA', rotulo: 'Jurídica' }].map((tipo) => (
                <span key={tipo.valor} className="campo-checkbox">
                  <RadioButton inputId={`tipo-${tipo.valor}`} name="tipo" value={tipo.valor} disabled={editando}
                               checked={form.tipo === tipo.valor} onChange={(e) => definir('tipo')(e.value)} />
                  <label htmlFor={`tipo-${tipo.valor}`}>{tipo.rotulo}</label>
                </span>
              ))}
            </div>
          </Campo>

          <Campo rotulo="Cadastrado como" obrigatorio tamanho={8}>
            <div className="opcoes-radio">
              <span className="campo-checkbox">
                <Checkbox inputId="cliente" checked={form.cliente} onChange={(e) => definir('cliente')(e.checked)} />
                <label htmlFor="cliente">Cliente</label>
              </span>
              <span className="campo-checkbox">
                <Checkbox inputId="fornecedor" checked={form.fornecedor} onChange={(e) => definir('fornecedor')(e.checked)} />
                <label htmlFor="fornecedor">Fornecedor</label>
              </span>
            </div>
          </Campo>

          {fisica ? (
            <>
              <Campo id="cpf" rotulo="CPF" tamanho={3}>
                <InputMask id="cpf" mask="999.999.999-99" autoClear={false} value={form.cpf}
                           onChange={(e) => definir('cpf')(e.target.value ?? '')}
                           onComplete={editando ? undefined : (e) => verificarCpf(e.value)} />
              </Campo>
              <Campo id="rg" rotulo="RG" tamanho={3}>
                <InputText id="rg" maxLength={30} value={form.rg} onChange={definirTexto('rg')} />
              </Campo>
              <Campo id="apelido" rotulo="Apelido" tamanho={6}>
                <InputText id="apelido" maxLength={255} value={form.apelido} onChange={definirTexto('apelido')} />
              </Campo>

              <Campo id="nome" rotulo="Nome" obrigatorio>
                <InputText id="nome" required maxLength={255} value={form.nome} onChange={definirTexto('nome')} />
              </Campo>

              <Campo rotulo="Sexo" tamanho={4}>
                <div className="opcoes-radio" role="radiogroup" aria-label="Sexo">
                  {SEXOS.map((sexo) => (
                    <span key={sexo.valor} className="campo-checkbox">
                      <RadioButton inputId={`sexo-${sexo.valor}`} name="sexo" value={sexo.valor}
                                   checked={form.sexo === sexo.valor} onChange={(e) => definir('sexo')(e.value)} />
                      <label htmlFor={`sexo-${sexo.valor}`}>{sexo.rotulo}</label>
                    </span>
                  ))}
                </div>
              </Campo>
              <Campo id="nascimento" rotulo="Data de nascimento" tamanho={3}>
                <Calendar inputId="nascimento" value={form.dataNascimento} onChange={(e) => definir('dataNascimento')(e.value)}
                          dateFormat="dd/mm/yy" mask="99/99/9999" showIcon maxDate={new Date()} />
              </Campo>
              <Campo id="estado-civil" rotulo="Estado civil" tamanho={2}>
                <Dropdown inputId="estado-civil" value={form.estadoCivil} options={ESTADOS_CIVIS} optionLabel="rotulo"
                          optionValue="valor" showClear placeholder="Selecione" onChange={(e) => definir('estadoCivil')(e.value)} />
              </Campo>
              <Campo id="profissao" rotulo="Profissão" tamanho={3}>
                <InputText id="profissao" maxLength={255} value={form.profissao} onChange={definirTexto('profissao')} />
              </Campo>
            </>
          ) : (
            <>
              <Campo id="cnpj" rotulo="CNPJ" tamanho={4}
                     ajuda={buscandoCnpj ? 'Buscando dados da empresa...' : (editando ? undefined : 'Ao completar o CNPJ, os dados são buscados na BrasilAPI.')}>
                <InputMask id="cnpj" mask="99.999.999/9999-99" autoClear={false} value={form.cnpj}
                           onChange={(e) => definir('cnpj')(e.target.value ?? '')}
                           onComplete={editando ? undefined : (e) => preencherPorCnpj(e.value)} />
              </Campo>
              <Campo id="inscricao-estadual" rotulo="Inscrição estadual" tamanho={4}>
                <InputText id="inscricao-estadual" maxLength={30} value={form.inscricaoEstadual}
                           onChange={definirTexto('inscricaoEstadual')} />
              </Campo>
              <Campo id="inscricao-municipal" rotulo="Inscrição municipal" tamanho={4}>
                <InputText id="inscricao-municipal" maxLength={30} value={form.inscricaoMunicipal}
                           onChange={definirTexto('inscricaoMunicipal')} />
              </Campo>

              <Campo id="razao-social" rotulo="Razão social" obrigatorio tamanho={6}>
                <InputText id="razao-social" required maxLength={255} value={form.razaoSocial}
                           onChange={definirTexto('razaoSocial')} />
              </Campo>
              <Campo id="nome-fantasia" rotulo="Nome fantasia" tamanho={6}>
                <InputText id="nome-fantasia" maxLength={255} value={form.nomeFantasia}
                           onChange={definirTexto('nomeFantasia')} />
              </Campo>
            </>
          )}

          <Campo id="observacao" rotulo="Observação">
            <InputTextarea id="observacao" rows={4} maxLength={2000} autoResize value={form.observacao}
                           onChange={definirTexto('observacao')} />
          </Campo>
        </GradeCampos>
      </SecaoCrud>

      <DialogoCpfExistente
        existente={cpfExistente}
        jaPossuiCadastro={!!cpfExistente && (cpfExistente.cliente || cpfExistente.fornecedor)}
        aoUsar={usarCadastroExistente}
        aoAbrir={() => navigate(`${ROTA_LISTA}/${cpfExistente.pessoaId}`)}
        aoCancelar={cancelarCpfExistente}
      />
      <Endereco endereco={form.endereco} aoAlterar={alterarEndereco} />
      <Contatos telefones={form.telefones} emails={form.emails} aoAlterar={alterarContatos} />
    </>
  )

  const nomeExibido = fisica ? form.nome : form.razaoSocial
  return (
    <form onSubmit={handleSubmit}>
      <CrudPagina
        titulo={editando ? (carregando ? 'Cadastro' : nomeExibido) : 'Novo cliente/fornecedor'}
        subtitulo={editando ? 'Editar cliente/fornecedor' : 'Cadastro de cliente/fornecedor'}
        aoVoltar={() => navigate(ROTA_LISTA)}
        ancoras={carregando ? undefined : ANCORAS}
        rodape={(
          <RodapeCrud
            editando={editando}
            carregando={carregando}
            salvando={salvando}
            aoExcluir={handleExcluir}
            podeExcluir={pode('CLIENTES_FORNECEDORES_EXCLUIR')} podeSalvar={pode(editando ? 'CLIENTES_FORNECEDORES_ALTERAR' : 'CLIENTES_FORNECEDORES_INCLUIR')}
            aoFechar={() => navigate(ROTA_LISTA)}
          />
        )}
      >
        {carregando ? <CrudSkeleton blocos={[[12, 4, 8, 3, 3, 6, 12, 4, 3, 2, 3, 12], [2, 5, 2, 3, 5, 5, 2], [6, 6]]} /> : conteudo}
      </CrudPagina>
    </form>
  )
}
