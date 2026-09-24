/** Constantes e conversores compartilhados pelos cadastros de pessoa (funcionário, cliente, fornecedor). */

export const SEXOS = [
  { valor: 'MASCULINO', rotulo: 'Masculino' },
  { valor: 'FEMININO', rotulo: 'Feminino' },
  { valor: 'OUTRO', rotulo: 'Outro' },
]

export const ESTADOS_CIVIS = [
  { valor: 'SOLTEIRO', rotulo: 'Solteiro(a)' },
  { valor: 'CASADO', rotulo: 'Casado(a)' },
  { valor: 'SEPARADO', rotulo: 'Separado(a)' },
  { valor: 'DIVORCIADO', rotulo: 'Divorciado(a)' },
  { valor: 'VIUVO', rotulo: 'Viúvo(a)' },
  { valor: 'UNIAO_ESTAVEL', rotulo: 'União estável' },
]

export const TIPOS_TELEFONE = [
  { valor: 'COMERCIAL', rotulo: 'Comercial' },
  { valor: 'RESIDENCIAL', rotulo: 'Residencial' },
  { valor: 'CELULAR', rotulo: 'Celular' },
  { valor: 'OUTRO', rotulo: 'Outro' },
]

export const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map((uf) => ({ valor: uf, rotulo: uf }))

export const rotuloTipoTelefone = (tipo) => TIPOS_TELEFONE.find((t) => t.valor === tipo)?.rotulo ?? tipo

export const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const ENDERECO_VAZIO = { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: null }

let proximoIdLocal = 0
/** Identificador só do navegador, para as linhas de telefone/e-mail que ainda não existem no servidor. */
export const idLocal = () => `linha-${++proximoIdLocal}`

export function enderecoParaFormulario(endereco) {
  return {
    ...ENDERECO_VAZIO,
    ...Object.fromEntries(Object.entries(endereco ?? {}).map(([k, v]) => [k, v ?? (k === 'estado' ? null : '')])),
  }
}

export const telefonesParaFormulario = (telefones) =>
  (telefones ?? []).map((t) => ({ ...t, observacao: t.observacao ?? '', _id: idLocal() }))

export const emailsParaFormulario = (emails) =>
  (emails ?? []).map((e) => ({ ...e, observacao: e.observacao ?? '', _id: idLocal() }))

export const enderecoParaRequisicao = (endereco) => ({ ...endereco, estado: endereco.estado ?? '' })

export const telefonesParaRequisicao = (telefones) =>
  telefones.filter((t) => t.numero).map(({ tipo, numero, observacao }) => ({ tipo, numero, observacao }))

export const emailsParaRequisicao = (emails) =>
  emails.filter((e) => e.email).map(({ email, observacao }) => ({ email, observacao }))
