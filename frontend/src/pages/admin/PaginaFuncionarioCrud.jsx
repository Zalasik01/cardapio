import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Checkbox } from 'primereact/checkbox'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Dropdown } from 'primereact/dropdown'
import { InputMask } from 'primereact/inputmask'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { RadioButton } from 'primereact/radiobutton'
import { useAuth } from '../../context/AuthContext'
import {
  atualizarFuncionario, criarFuncionario, excluirFuncionario, obterFuncionario,
} from '../../api/funcionariosApi'
import CrudPagina from '../../components/crud/CrudPagina'
import { Campo, GradeCampos, SecaoCrud } from '../../components/crud/Campo'
import { FormularioSkeleton } from '../../components/Skeleton'
import { dataParaIso, formatarCpf, isoParaData, soDigitos } from '../../utils/formatadores'

const ROTA_LISTA = '/admin/funcionarios'

const SEXOS = [
  { valor: 'MASCULINO', rotulo: 'Masculino' },
  { valor: 'FEMININO', rotulo: 'Feminino' },
  { valor: 'OUTRO', rotulo: 'Outro' },
]

const ESTADOS_CIVIS = [
  { valor: 'SOLTEIRO', rotulo: 'Solteiro(a)' },
  { valor: 'CASADO', rotulo: 'Casado(a)' },
  { valor: 'SEPARADO', rotulo: 'Separado(a)' },
  { valor: 'DIVORCIADO', rotulo: 'Divorciado(a)' },
  { valor: 'VIUVO', rotulo: 'Viúvo(a)' },
  { valor: 'UNIAO_ESTAVEL', rotulo: 'União estável' },
]

const TIPOS_TELEFONE = [
  { valor: 'COMERCIAL', rotulo: 'Comercial' },
  { valor: 'RESIDENCIAL', rotulo: 'Residencial' },
  { valor: 'CELULAR', rotulo: 'Celular' },
  { valor: 'OUTRO', rotulo: 'Outro' },
]

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map((uf) => ({ valor: uf, rotulo: uf }))

const ENDERECO_VAZIO = { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: null }

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

let proximoIdLocal = 0
const idLocal = () => `linha-${++proximoIdLocal}`

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
    endereco: { ...ENDERECO_VAZIO, ...Object.fromEntries(Object.entries(funcionario.endereco ?? {}).map(([k, v]) => [k, v ?? (k === 'estado' ? null : '')])) },
    telefones: (funcionario.telefones ?? []).map((t) => ({ ...t, observacao: t.observacao ?? '', _id: idLocal() })),
    emails: (funcionario.emails ?? []).map((e) => ({ ...e, observacao: e.observacao ?? '', _id: idLocal() })),
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
    endereco: { ...form.endereco, estado: form.endereco.estado ?? '' },
    telefones: form.telefones.filter((t) => t.numero).map(({ tipo, numero, observacao }) => ({ tipo, numero, observacao })),
    emails: form.emails.filter((e) => e.email).map(({ email, observacao }) => ({ email, observacao })),
  }
}

/** Cadastro de funcionario: /admin/funcionarios/novo e /admin/funcionarios/:guid. */
export default function PaginaFuncionarioCrud() {
  const { guid } = useParams()
  const editando = guid !== undefined
  const { loja } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(FORM_VAZIO)
  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const [mensagem, setMensagem] = useState(null)

  useEffect(() => {
    if (!editando) return
    setCarregando(true)
    obterFuncionario(loja.tenant, guid)
      .then((funcionario) => setForm(paraFormulario(funcionario)))
      .catch((e) => setErro(e.mensagem))
      .finally(() => setCarregando(false))
  }, [editando, guid, loja.tenant])

  const definir = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }))
  const definirTexto = (campo) => (e) => definir(campo)(e.target.value)
  const definirEndereco = (campo) => (valor) => setForm((atual) => ({ ...atual, endereco: { ...atual.endereco, [campo]: valor } }))

  function alterarLinha(lista, id, campo, valor) {
    setForm((atual) => ({ ...atual, [lista]: atual[lista].map((linha) => (linha._id === id ? { ...linha, [campo]: valor } : linha)) }))
  }
  function removerLinha(lista, id) {
    setForm((atual) => ({ ...atual, [lista]: atual[lista].filter((linha) => linha._id !== id) }))
  }
  function adicionarTelefone() {
    setForm((atual) => ({ ...atual, telefones: [...atual.telefones, { _id: idLocal(), tipo: 'CELULAR', numero: '', observacao: '' }] }))
  }
  function adicionarEmail() {
    setForm((atual) => ({ ...atual, emails: [...atual.emails, { _id: idLocal(), email: '', observacao: '' }] }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    setMensagem(null)
    setSalvando(true)
    try {
      if (editando) {
        await atualizarFuncionario(loja.tenant, guid, paraRequisicao(form))
        setMensagem('Funcionário atualizado com sucesso')
      } else {
        await criarFuncionario(loja.tenant, paraRequisicao(form))
        navigate(ROTA_LISTA)
      }
    } catch (e2) {
      setErro(e2.mensagem)
    } finally {
      setSalvando(false)
    }
  }

  async function handleExcluir() {
    if (!confirm('Excluir este funcionário?')) return
    try {
      await excluirFuncionario(loja.tenant, guid)
      navigate(ROTA_LISTA)
    } catch (e) {
      setErro(e.mensagem)
    }
  }

  const conteudo = (
    <>
      <SecaoCrud titulo="Principal">
        <GradeCampos>
          <div className="campo campo--12 campo--linha">
            <span className="campo-checkbox">
              <Checkbox inputId="ativo" checked={form.ativo} onChange={(e) => definir('ativo')(e.checked)} />
              <label htmlFor="ativo">Ativo</label>
            </span>
          </div>

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
                       onChange={(e) => definir('cpf')(e.target.value ?? '')} />
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

      <SecaoCrud titulo="Endereço">
        <GradeCampos>
          <Campo id="cep" rotulo="CEP" tamanho={2}>
            <InputMask id="cep" mask="99999-999" autoClear={false} value={form.endereco.cep}
                       onChange={(e) => definirEndereco('cep')(e.target.value ?? '')} />
          </Campo>
          <Campo id="logradouro" rotulo="Logradouro" tamanho={5}>
            <InputText id="logradouro" maxLength={255} value={form.endereco.logradouro}
                       onChange={(e) => definirEndereco('logradouro')(e.target.value)} />
          </Campo>
          <Campo id="numero" rotulo="Número" tamanho={2}>
            <InputText id="numero" maxLength={20} value={form.endereco.numero}
                       onChange={(e) => definirEndereco('numero')(e.target.value)} />
          </Campo>
          <Campo id="complemento" rotulo="Complemento" tamanho={3}>
            <InputText id="complemento" maxLength={255} value={form.endereco.complemento}
                       onChange={(e) => definirEndereco('complemento')(e.target.value)} />
          </Campo>
          <Campo id="bairro" rotulo="Bairro" tamanho={5}>
            <InputText id="bairro" maxLength={255} value={form.endereco.bairro}
                       onChange={(e) => definirEndereco('bairro')(e.target.value)} />
          </Campo>
          <Campo id="cidade" rotulo="Cidade" tamanho={5}>
            <InputText id="cidade" maxLength={255} value={form.endereco.cidade}
                       onChange={(e) => definirEndereco('cidade')(e.target.value)} />
          </Campo>
          <Campo id="uf" rotulo="Estado" tamanho={2}>
            <Dropdown inputId="uf" value={form.endereco.estado} options={UFS} optionLabel="rotulo" optionValue="valor"
                      showClear filter placeholder="UF" onChange={(e) => definirEndereco('estado')(e.value ?? null)} />
          </Campo>
        </GradeCampos>
      </SecaoCrud>

      <SecaoCrud titulo="Contatos">
        <div className="contatos">
          <div className="contatos__lista">
            <DataTable value={form.telefones} dataKey="_id" emptyMessage="Nenhum telefone cadastrado." className="tabela-dados">
              <Column header="Tipo do telefone" style={{ width: '30%' }} body={(t) => (
                <Dropdown value={t.tipo} options={TIPOS_TELEFONE} optionLabel="rotulo" optionValue="valor"
                          aria-label="Tipo do telefone" onChange={(e) => alterarLinha('telefones', t._id, 'tipo', e.value)} />
              )} />
              <Column header="Número" style={{ width: '30%' }} body={(t) => (
                <InputMask key={t.tipo} mask={t.tipo === 'CELULAR' ? '(99) 99999-9999' : '(99) 9999-9999'} autoClear={false}
                           aria-label="Número" value={t.numero} onChange={(e) => alterarLinha('telefones', t._id, 'numero', e.target.value ?? '')} />
              )} />
              <Column header="Observação" body={(t) => (
                <InputText aria-label="Observação do telefone" maxLength={255} value={t.observacao}
                           onChange={(e) => alterarLinha('telefones', t._id, 'observacao', e.target.value)} />
              )} />
              <Column style={{ width: '3.5rem' }} body={(t) => (
                <Button type="button" icon="pi pi-trash" rounded text severity="danger" aria-label="Remover telefone"
                        onClick={() => removerLinha('telefones', t._id)} />
              )} />
            </DataTable>
            <Button type="button" label="Novo telefone" icon="pi pi-plus" size="small" outlined onClick={adicionarTelefone} />
          </div>

          <div className="contatos__lista">
            <DataTable value={form.emails} dataKey="_id" emptyMessage="Nenhum e-mail cadastrado." className="tabela-dados">
              <Column header="E-mail" body={(m) => (
                <InputText type="email" aria-label="E-mail" maxLength={255} value={m.email}
                           onChange={(e) => alterarLinha('emails', m._id, 'email', e.target.value)} />
              )} />
              <Column header="Observação" body={(m) => (
                <InputText aria-label="Observação do e-mail" maxLength={255} value={m.observacao}
                           onChange={(e) => alterarLinha('emails', m._id, 'observacao', e.target.value)} />
              )} />
              <Column style={{ width: '3.5rem' }} body={(m) => (
                <Button type="button" icon="pi pi-trash" rounded text severity="danger" aria-label="Remover e-mail"
                        onClick={() => removerLinha('emails', m._id)} />
              )} />
            </DataTable>
            <Button type="button" label="Novo e-mail" icon="pi pi-plus" size="small" outlined onClick={adicionarEmail} />
          </div>
        </div>
      </SecaoCrud>
    </>
  )

  return (
    <form onSubmit={handleSubmit}>
      <CrudPagina
        titulo={editando ? (carregando ? 'Funcionário' : form.nome) : 'Novo funcionário'}
        subtitulo={editando ? 'Editar funcionário' : 'Cadastro de funcionário'}
        aoVoltar={() => navigate(ROTA_LISTA)}
        rodape={(
          <>
            {erro && <p className="mensagem-erro crud__mensagem" role="alert">{erro}</p>}
            {mensagem && <p className="mensagem-sucesso crud__mensagem" role="status">{mensagem}</p>}
            <div className="crud__acoes">
              {editando && (
                <Button type="button" label="Excluir" icon="pi pi-trash" severity="danger" outlined
                        disabled={carregando} onClick={handleExcluir} />
              )}
              <span className="crud__espaco" />
              <Button type="button" label="Fechar" severity="secondary" outlined onClick={() => navigate(ROTA_LISTA)} />
              <Button type="submit" label={salvando ? 'Salvando...' : 'Salvar alterações'} disabled={salvando || carregando} />
            </div>
          </>
        )}
      >
        {carregando ? <FormularioSkeleton campos={6} /> : conteudo}
      </CrudPagina>
    </form>
  )
}
