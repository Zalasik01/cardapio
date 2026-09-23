import { useEffect, useRef, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Checkbox } from 'primereact/checkbox'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputMask } from 'primereact/inputmask'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { RadioButton } from 'primereact/radiobutton'
import { useAuth } from '../../context/AuthContext'
import { dispatchMsgError, dispatchMsgSuccess, dispatchMsgWarn } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import { buscarEnderecoPorCep } from '../../api/cepApi'
import {
  atualizarFuncionario, criarFuncionario, excluirFuncionario, obterFuncionario,
} from '../../api/funcionariosApi'
import CrudPagina from '../../components/crud/CrudPagina'
import { Campo, GradeCampos, SecaoCrud } from '../../components/crud/Campo'
import { FormularioSkeleton } from '../../components/Skeleton'
import { dataParaIso, formatarCpf, isoParaData, linkWhatsapp, soDigitos } from '../../utils/formatadores'

const ROTA_LISTA = '/admin/funcionarios'

const ANCORAS = [
  { id: 'secao-principal', titulo: 'Principal' },
  { id: 'secao-endereco', titulo: 'Endereço' },
  { id: 'secao-contatos', titulo: 'Contatos' },
]

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

const rotuloTipoTelefone = (tipo) => TIPOS_TELEFONE.find((t) => t.valor === tipo)?.rotulo ?? tipo
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
  const { definirMigalha } = useOutletContext()

  const [form, setForm] = useState(FORM_VAZIO)
  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [avisoCep, setAvisoCep] = useState(null)
  const numeroRef = useRef(null)
  const [dialogoTelefone, setDialogoTelefone] = useState(null) // { _id?, tipo, numero, observacao }
  const [dialogoEmail, setDialogoEmail] = useState(null) // { _id?, email, observacao }
  const consultaCep = useRef(0) // ignora respostas de consultas antigas

  useEffect(() => {
    definirMigalha(editando ? 'Editando funcionário' : 'Novo funcionário')
    return () => definirMigalha(null)
  }, [editando, definirMigalha])

  useEffect(() => {
    if (!editando) return
    setCarregando(true)
    obterFuncionario(loja.tenant, guid)
      .then((funcionario) => setForm(paraFormulario(funcionario)))
      .catch((e) => dispatchMsgError(e.mensagem))
      .finally(() => setCarregando(false))
  }, [editando, guid, loja.tenant])

  const definir = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }))
  const definirTexto = (campo) => (e) => definir(campo)(e.target.value)
  const definirEndereco = (campo) => (valor) => setForm((atual) => ({ ...atual, endereco: { ...atual.endereco, [campo]: valor } }))

  function removerLinha(lista, id) {
    setForm((atual) => ({ ...atual, [lista]: atual[lista].filter((linha) => linha._id !== id) }))
  }

  /** Inclui ou substitui (quando ja tem _id) uma linha de contato. */
  function salvarLinha(lista, linha) {
    setForm((atual) => {
      const existe = linha._id && atual[lista].some((item) => item._id === linha._id)
      return {
        ...atual,
        [lista]: existe
          ? atual[lista].map((item) => (item._id === linha._id ? linha : item))
          : [...atual[lista], { ...linha, _id: idLocal() }],
      }
    })
  }

  function confirmarTelefone() {
    if (soDigitos(dialogoTelefone.numero).length < 10) {
      dispatchMsgWarn('Informe o número completo, com DDD.')
      return
    }
    salvarLinha('telefones', dialogoTelefone)
    setDialogoTelefone(null)
  }

  function confirmarEmail() {
    if (!REGEX_EMAIL.test(dialogoEmail.email.trim())) {
      dispatchMsgWarn('Informe um e-mail válido.')
      return
    }
    salvarLinha('emails', { ...dialogoEmail, email: dialogoEmail.email.trim() })
    setDialogoEmail(null)
  }

  /** Enter dentro do modal confirma (o modal nao usa <form> para nao disparar o envio do cadastro). */
  const aoTeclarDialogo = (confirmar) => (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      confirmar()
    }
  }

  /** Preenche logradouro, bairro, cidade e UF a partir do CEP (ViaCEP). O numero e o complemento continuam manuais. */
  async function preencherPorCep(cep) {
    const consulta = ++consultaCep.current
    setAvisoCep(null)
    setBuscandoCep(true)
    try {
      const endereco = await buscarEnderecoPorCep(cep)
      if (consulta !== consultaCep.current) return
      if (!endereco) {
        setAvisoCep('CEP não encontrado. Preencha o endereço manualmente.')
        return
      }
      setForm((atual) => ({
        ...atual,
        endereco: {
          ...atual.endereco,
          logradouro: endereco.logradouro || atual.endereco.logradouro,
          bairro: endereco.bairro || atual.endereco.bairro,
          cidade: endereco.cidade || atual.endereco.cidade,
          estado: endereco.estado || atual.endereco.estado,
          complemento: atual.endereco.complemento || endereco.complemento,
        },
      }))
      numeroRef.current?.focus()
    } catch {
      if (consulta === consultaCep.current) {
        setAvisoCep('Não foi possível consultar o CEP agora. Preencha o endereço manualmente.')
      }
    } finally {
      if (consulta === consultaCep.current) setBuscandoCep(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSalvando(true)
    try {
      if (editando) {
        await atualizarFuncionario(loja.tenant, guid, paraRequisicao(form))
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
          await excluirFuncionario(loja.tenant, guid)
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

      <SecaoCrud id="secao-endereco" titulo="Endereço">
        <GradeCampos>
          <Campo id="cep" rotulo="CEP" tamanho={2} ajuda={buscandoCep ? 'Buscando endereço...' : avisoCep}>
            <InputMask id="cep" mask="99999-999" autoClear={false} value={form.endereco.cep}
                       onChange={(e) => definirEndereco('cep')(e.target.value ?? '')}
                       onComplete={(e) => preencherPorCep(e.value)} />
          </Campo>
          <Campo id="logradouro" rotulo="Logradouro" tamanho={5}>
            <InputText id="logradouro" maxLength={255} value={form.endereco.logradouro}
                       onChange={(e) => definirEndereco('logradouro')(e.target.value)} />
          </Campo>
          <Campo id="numero" rotulo="Número" tamanho={2}>
            <InputText id="numero" ref={numeroRef} maxLength={20} value={form.endereco.numero}
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

      <SecaoCrud id="secao-contatos" titulo="Contatos">
        <div className="contatos">
          <div className="contatos__lista">
            <DataTable value={form.telefones} dataKey="_id" emptyMessage="Nenhum telefone cadastrado." className="tabela-dados">
              <Column header="Tipo do telefone" body={(t) => rotuloTipoTelefone(t.tipo)} />
              <Column header="Número" body={(t) => (
                <span className="contato-numero">
                  {t.numero}
                  {t.tipo === 'CELULAR' && linkWhatsapp(t.numero) && (
                    <a className="contato-whatsapp" href={linkWhatsapp(t.numero)} target="_blank" rel="noopener noreferrer"
                       title="Abrir no WhatsApp" aria-label={`Abrir ${t.numero} no WhatsApp`}>
                      <i className="fa-brands fa-whatsapp" aria-hidden="true" />
                    </a>
                  )}
                </span>
              )} />
              <Column header="Observação" field="observacao" />
              <Column style={{ width: '6.5rem', textAlign: 'right' }} body={(t) => (
                <span className="contato-acoes">
                  <Button type="button" icon="pi pi-pencil" rounded text severity="secondary" aria-label="Editar telefone"
                          onClick={() => { setDialogoTelefone({ ...t }) }} />
                  <Button type="button" icon="pi pi-trash" rounded text severity="danger" aria-label="Remover telefone"
                          onClick={() => removerLinha('telefones', t._id)} />
                </span>
              )} />
            </DataTable>
            <Button type="button" label="Novo telefone" icon="pi pi-plus" size="small" outlined
                    onClick={() => { setDialogoTelefone({ tipo: 'CELULAR', numero: '', observacao: '' }) }} />
          </div>

          <div className="contatos__lista">
            <DataTable value={form.emails} dataKey="_id" emptyMessage="Nenhum e-mail cadastrado." className="tabela-dados">
              <Column header="E-mail" field="email" />
              <Column header="Observação" field="observacao" />
              <Column style={{ width: '6.5rem', textAlign: 'right' }} body={(m) => (
                <span className="contato-acoes">
                  <Button type="button" icon="pi pi-pencil" rounded text severity="secondary" aria-label="Editar e-mail"
                          onClick={() => { setDialogoEmail({ ...m }) }} />
                  <Button type="button" icon="pi pi-trash" rounded text severity="danger" aria-label="Remover e-mail"
                          onClick={() => removerLinha('emails', m._id)} />
                </span>
              )} />
            </DataTable>
            <Button type="button" label="Novo e-mail" icon="pi pi-plus" size="small" outlined
                    onClick={() => { setDialogoEmail({ email: '', observacao: '' }) }} />
          </div>
        </div>
      </SecaoCrud>

      <Dialog
        header={dialogoTelefone?._id ? 'Editar telefone' : 'Novo telefone'}
        visible={!!dialogoTelefone}
        onHide={() => setDialogoTelefone(null)}
        style={{ width: 'min(28rem, 92vw)' }}
        footer={(
          <>
            <Button type="button" label="Cancelar" severity="secondary" outlined onClick={() => setDialogoTelefone(null)} />
            <Button type="button" label="Confirmar" onClick={confirmarTelefone} />
          </>
        )}
      >
        {dialogoTelefone && (
          <div className="dialogo-campos" onKeyDown={aoTeclarDialogo(confirmarTelefone)}>
            <Campo id="dlg-tipo" rotulo="Tipo do telefone" obrigatorio>
              <Dropdown inputId="dlg-tipo" value={dialogoTelefone.tipo} options={TIPOS_TELEFONE} optionLabel="rotulo"
                        optionValue="valor" onChange={(e) => setDialogoTelefone({ ...dialogoTelefone, tipo: e.value })} />
            </Campo>
            <Campo id="dlg-numero" rotulo="Número" obrigatorio
                   ajuda={dialogoTelefone.tipo === 'CELULAR' ? 'Celulares mostram um atalho para abrir o WhatsApp.' : undefined}>
              <InputMask key={dialogoTelefone.tipo} id="dlg-numero" autoFocus autoClear={false}
                         mask={dialogoTelefone.tipo === 'CELULAR' ? '(99) 99999-9999' : '(99) 9999-9999'}
                         value={dialogoTelefone.numero}
                         onChange={(e) => setDialogoTelefone({ ...dialogoTelefone, numero: e.target.value ?? '' })} />
            </Campo>
            <Campo id="dlg-obs-tel" rotulo="Observação">
              <InputText id="dlg-obs-tel" maxLength={255} value={dialogoTelefone.observacao}
                         onChange={(e) => setDialogoTelefone({ ...dialogoTelefone, observacao: e.target.value })} />
            </Campo>
          </div>
        )}
      </Dialog>

      <Dialog
        header={dialogoEmail?._id ? 'Editar e-mail' : 'Novo e-mail'}
        visible={!!dialogoEmail}
        onHide={() => setDialogoEmail(null)}
        style={{ width: 'min(28rem, 92vw)' }}
        footer={(
          <>
            <Button type="button" label="Cancelar" severity="secondary" outlined onClick={() => setDialogoEmail(null)} />
            <Button type="button" label="Confirmar" onClick={confirmarEmail} />
          </>
        )}
      >
        {dialogoEmail && (
          <div className="dialogo-campos" onKeyDown={aoTeclarDialogo(confirmarEmail)}>
            <Campo id="dlg-email" rotulo="E-mail" obrigatorio>
              <InputText id="dlg-email" type="email" autoFocus maxLength={255} value={dialogoEmail.email}
                         onChange={(e) => setDialogoEmail({ ...dialogoEmail, email: e.target.value })} />
            </Campo>
            <Campo id="dlg-obs-email" rotulo="Observação">
              <InputText id="dlg-obs-email" maxLength={255} value={dialogoEmail.observacao}
                         onChange={(e) => setDialogoEmail({ ...dialogoEmail, observacao: e.target.value })} />
            </Campo>
          </div>
        )}
      </Dialog>
    </>
  )

  return (
    <form onSubmit={handleSubmit}>
      <CrudPagina
        titulo={editando ? (carregando ? 'Funcionário' : form.nome) : 'Novo funcionário'}
        subtitulo={editando ? 'Editar funcionário' : 'Cadastro de funcionário'}
        aoVoltar={() => navigate(ROTA_LISTA)}
        ancoras={carregando ? undefined : ANCORAS}
        rodape={(
          <>
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
