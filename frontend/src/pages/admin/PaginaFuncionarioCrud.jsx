import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { Calendar } from 'primereact/calendar'
import { Dropdown } from 'primereact/dropdown'
import { InputMask } from 'primereact/inputmask'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { RadioButton } from 'primereact/radiobutton'
import { useAuth } from '../../context/AuthContext'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import {
  atualizarFuncionario, criarFuncionario, excluirFuncionario, obterFuncionario,
} from '../../api/funcionariosApi'
import { consultarPessoaPorCpf } from '../../api/pessoasApi'
import DialogoCpfExistente from '../../components/crud/DialogoCpfExistente'
import CrudPagina from '../../components/crud/CrudPagina'
import CampoAtivo from '../../components/crud/CampoAtivo'
import Endereco from '../../components/crud/Endereco'
import RodapeCrud from '../../components/crud/RodapeCrud'
import { Campo, GradeCampos, SecaoCrud } from '../../components/crud/Campo'
import Contatos from '../../components/crud/Contatos'
import { CrudSkeleton } from '../../components/Skeleton'
import { dataParaIso, formatarCpf, isoParaData, soDigitos } from '../../utils/formatadores'
import {
  emailsParaFormulario, emailsParaRequisicao, ENDERECO_VAZIO, enderecoParaFormulario, enderecoParaRequisicao,
  ESTADOS_CIVIS, SEXOS, telefonesParaFormulario, telefonesParaRequisicao,
} from '../../utils/pessoa'

const ROTA_LISTA = '/admin/funcionarios'

const ANCORAS = [
  { id: 'secao-principal', titulo: 'Principal' },
  { id: 'secao-endereco', titulo: 'Endereço' },
  { id: 'secao-contatos', titulo: 'Contatos' },
]

const FORM_VAZIO = {
  ativo: true,
  sexo: null,
  cpf: '',
  rg: '',
  apelido: '',
  nome: '',
  naturalidade: '',
  nacionalidade: 'Brasileiro',
  dataNascimento: null,
  profissao: '',
  estadoCivil: null,
  numeroCnh: '',
  vencimentoCnh: null,
  observacao: '',
  endereco: ENDERECO_VAZIO,
  telefones: [],
  emails: [],
}

function paraFormulario(funcionario) {
  return {
    ativo: funcionario.ativo,
    sexo: funcionario.sexo,
    cpf: formatarCpf(funcionario.cpf),
    rg: funcionario.rg ?? '',
    apelido: funcionario.apelido ?? '',
    nome: funcionario.nome,
    naturalidade: funcionario.naturalidade ?? '',
    nacionalidade: funcionario.nacionalidade ?? '',
    dataNascimento: isoParaData(funcionario.dataNascimento),
    profissao: funcionario.profissao ?? '',
    estadoCivil: funcionario.estadoCivil,
    numeroCnh: funcionario.numeroCnh ?? '',
    vencimentoCnh: isoParaData(funcionario.vencimentoCnh),
    observacao: funcionario.observacao ?? '',
    endereco: enderecoParaFormulario(funcionario.endereco),
    telefones: telefonesParaFormulario(funcionario.telefones),
    emails: emailsParaFormulario(funcionario.emails),
  }
}

function paraRequisicao(form) {
  return {
    ativo: form.ativo,
    sexo: form.sexo,
    cpf: soDigitos(form.cpf),
    rg: form.rg,
    apelido: form.apelido,
    nome: form.nome,
    naturalidade: form.naturalidade,
    nacionalidade: form.nacionalidade,
    dataNascimento: dataParaIso(form.dataNascimento),
    profissao: form.profissao,
    estadoCivil: form.estadoCivil,
    numeroCnh: form.numeroCnh,
    vencimentoCnh: dataParaIso(form.vencimentoCnh),
    observacao: form.observacao,
    endereco: enderecoParaRequisicao(form.endereco),
    telefones: telefonesParaRequisicao(form.telefones),
    emails: emailsParaRequisicao(form.emails),
  }
}

/** Cadastro de funcionario: /admin/funcionarios/novo e /admin/funcionarios/:id. */
export default function PaginaFuncionarioCrud() {
  const { id } = useParams()
  const editando = id !== undefined
  const { loja, pode } = useAuth()
  const navigate = useNavigate()
  const { definirMigalha } = useOutletContext()

  const [form, setForm] = useState(FORM_VAZIO)
  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)
  const [cpfExistente, setCpfExistente] = useState(null) // pessoa que já usa o CPF digitado

  useEffect(() => {
    definirMigalha(editando ? 'Editando funcionário' : 'Novo funcionário')
    return () => definirMigalha(null)
  }, [editando, definirMigalha])

  useEffect(() => {
    if (!editando) return
    setCarregando(true)
    obterFuncionario(loja.tenant, id)
      .then((funcionario) => setForm(paraFormulario(funcionario)))
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

  /** Ao completar o CPF, verifica se a pessoa já existe na loja (ex.: é cliente ou fornecedor). */
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
      naturalidade: e.naturalidade ?? atual.naturalidade,
      nacionalidade: e.nacionalidade ?? atual.nacionalidade,
      numeroCnh: e.numeroCnh ?? atual.numeroCnh,
      vencimentoCnh: e.vencimentoCnh ? isoParaData(e.vencimentoCnh) : atual.vencimentoCnh,
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

  async function handleSubmit(e) {
    e.preventDefault()
    setSalvando(true)
    try {
      if (editando) {
        await atualizarFuncionario(loja.tenant, id, paraRequisicao(form))
        dispatchMsgSuccess('Funcionário atualizado com sucesso')
      } else {
        await criarFuncionario(loja.tenant, paraRequisicao(form))
        dispatchMsgSuccess('Funcionário cadastrado com sucesso')
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
      mensagem: 'Excluir este funcionário?',
      aoConfirmar: async () => {
        try {
          await excluirFuncionario(loja.tenant, id)
          dispatchMsgSuccess('Funcionário excluído com sucesso')
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

          <Campo rotulo="Sexo">
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

          <Campo id="cpf" rotulo="CPF" obrigatorio tamanho={3}>
            <InputMask id="cpf" mask="999.999.999-99" required autoClear={false} value={form.cpf}
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

          <Campo id="naturalidade" rotulo="Naturalidade" tamanho={5}>
            <InputText id="naturalidade" maxLength={255} placeholder="Cidade / UF" value={form.naturalidade}
                       onChange={definirTexto('naturalidade')} />
          </Campo>
          <Campo id="nacionalidade" rotulo="Nacionalidade" tamanho={4}>
            <InputText id="nacionalidade" maxLength={255} value={form.nacionalidade} onChange={definirTexto('nacionalidade')} />
          </Campo>
          <Campo id="nascimento" rotulo="Data de nascimento" tamanho={3}>
            <Calendar inputId="nascimento" value={form.dataNascimento} onChange={(e) => definir('dataNascimento')(e.value)}
                      dateFormat="dd/mm/yy" mask="99/99/9999" showIcon maxDate={new Date()} />
          </Campo>

          <Campo id="profissao" rotulo="Profissão" tamanho={4}>
            <InputText id="profissao" maxLength={255} value={form.profissao} onChange={definirTexto('profissao')} />
          </Campo>
          <Campo id="estado-civil" rotulo="Estado civil" tamanho={3}>
            <Dropdown inputId="estado-civil" value={form.estadoCivil} options={ESTADOS_CIVIS} optionLabel="rotulo"
                      optionValue="valor" showClear placeholder="Selecione" onChange={(e) => definir('estadoCivil')(e.value)} />
          </Campo>
          <Campo id="cnh" rotulo="Número da CNH" tamanho={2}>
            <InputText id="cnh" maxLength={20} value={form.numeroCnh} onChange={definirTexto('numeroCnh')} />
          </Campo>
          <Campo id="venc-cnh" rotulo="Vencimento da CNH" tamanho={3}>
            <Calendar inputId="venc-cnh" value={form.vencimentoCnh} onChange={(e) => definir('vencimentoCnh')(e.value)}
                      dateFormat="dd/mm/yy" mask="99/99/9999" showIcon />
          </Campo>

          <Campo id="observacao" rotulo="Observação">
            <InputTextarea id="observacao" rows={4} maxLength={2000} autoResize value={form.observacao}
                           onChange={definirTexto('observacao')} />
          </Campo>
        </GradeCampos>
      </SecaoCrud>

      <DialogoCpfExistente
        existente={cpfExistente}
        jaPossuiCadastro={!!cpfExistente && !!cpfExistente.funcionarioId}
        aoUsar={usarCadastroExistente}
        aoAbrir={() => navigate(`${ROTA_LISTA}/${cpfExistente.funcionarioId}`)}
        aoCancelar={cancelarCpfExistente}
      />
      <Endereco endereco={form.endereco} aoAlterar={alterarEndereco} />
      <Contatos telefones={form.telefones} emails={form.emails} aoAlterar={alterarContatos} />
    </>
  )

  return (
    <form onSubmit={handleSubmit}>
      <CrudPagina
        somenteLeitura={!pode(editando ? 'FUNCIONARIOS_ALTERAR' : 'FUNCIONARIOS_INCLUIR')}
        titulo={editando ? (carregando ? 'Funcionário' : form.nome) : 'Novo funcionário'}
        subtitulo={editando ? 'Editar funcionário' : 'Cadastro de funcionário'}
        aoVoltar={() => navigate(ROTA_LISTA)}
        ancoras={carregando ? undefined : ANCORAS}
        rodape={(
          <RodapeCrud
            editando={editando}
            carregando={carregando}
            salvando={salvando}
            aoExcluir={handleExcluir}
            podeExcluir={pode('FUNCIONARIOS_EXCLUIR')} podeSalvar={pode(editando ? 'FUNCIONARIOS_ALTERAR' : 'FUNCIONARIOS_INCLUIR')}
            aoFechar={() => navigate(ROTA_LISTA)}
          />
        )}
      >
        {carregando ? <CrudSkeleton blocos={[[12, 12, 3, 3, 6, 12, 5, 4, 3, 4, 3, 2, 3, 12], [2, 5, 2, 3, 5, 5, 2], [6, 6]]} /> : conteudo}
      </CrudPagina>
    </form>
  )
}
