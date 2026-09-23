/**
 * Regras de senha forte. Espelham a PoliticaSenha do backend, que e quem de fato
 * valida; aqui servem para orientar o usuario enquanto ele digita.
 */
const SENHAS_COMUNS = new Set([
  '12345678', '123456789', '1234567890', '87654321', '11111111', '00000000',
  'password', 'password1', 'passw0rd', 'senha123', 'senha1234', 'senhasenha',
  'qwerty123', 'qwertyui', 'abc12345', 'abcd1234', 'admin123', 'admin1234',
  'mudar123', 'trocar123', 'brasil123', 'iloveyou',
])

function contemDadosPessoais(senha, { email = '', nome = '' }) {
  const minuscula = senha.toLowerCase()
  const usuarioEmail = email.toLowerCase().split('@')[0]
  if (usuarioEmail.length >= 4 && minuscula.includes(usuarioEmail)) return true
  return nome
    .toLowerCase()
    .split(/\s+/)
    .some((parte) => parte.length >= 4 && minuscula.includes(parte))
}

const REGRAS = [
  { id: 'tamanho', texto: 'Pelo menos 8 caracteres', ok: (s) => s.length >= 8 && s.length <= 72 },
  { id: 'minuscula', texto: 'Uma letra minúscula', ok: (s) => /\p{Ll}/u.test(s) },
  { id: 'maiuscula', texto: 'Uma letra maiúscula', ok: (s) => /\p{Lu}/u.test(s) },
  { id: 'numero', texto: 'Um número', ok: (s) => /\p{Nd}/u.test(s) },
  { id: 'simbolo', texto: 'Um símbolo (! @ # $ %)', ok: (s) => /[^\p{L}\p{N}]/u.test(s) },
  {
    id: 'comum',
    texto: 'Não ser uma senha comum ou repetitiva',
    ok: (s) => s.length > 0 && !SENHAS_COMUNS.has(s.toLowerCase()) && new Set(s).size > 2,
  },
  {
    id: 'pessoal',
    texto: 'Não conter seu nome ou e-mail',
    ok: (s, contexto) => s.length > 0 && !contemDadosPessoais(s, contexto),
  },
]

/** Avalia a senha: cada regra com ok/nao ok, se e forte e um nivel de 0 a 4 para o medidor. */
export function avaliarSenha(senha, contexto = {}) {
  const regras = REGRAS.map((regra) => ({ id: regra.id, texto: regra.texto, ok: regra.ok(senha, contexto) }))
  const cumpridas = regras.filter((regra) => regra.ok).length
  const forte = cumpridas === regras.length
  const nivel = senha ? (forte ? 4 : Math.min(3, Math.floor((cumpridas / regras.length) * 4))) : 0
  return { regras, forte, nivel }
}

export const ROTULOS_FORCA = ['', 'Fraca', 'Razoável', 'Boa', 'Forte']
