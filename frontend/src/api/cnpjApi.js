/**
 * Consulta de CNPJ na BrasilAPI (https://brasilapi.com.br), serviço público e gratuito.
 *
 * Usa fetch direto (e não a instância `http` do sistema) de propósito: aquela instância envia o
 * token de login em toda requisição, e ele nunca deve ser enviado a um serviço de terceiros.
 */
const TEMPO_LIMITE_MS = 8000

/**
 * Devolve { razaoSocial, nomeFantasia, situacao, endereco, telefones, email } ou null se o CNPJ
 * não existir. Lança Error se o serviço estiver indisponível.
 */
export async function buscarEmpresaPorCnpj(cnpj, { signal } = {}) {
  const digitos = String(cnpj ?? '').replace(/\D/g, '')
  if (digitos.length !== 14) return null

  const controle = new AbortController()
  const temporizador = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS)
  signal?.addEventListener('abort', () => controle.abort())

  try {
    const resposta = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digitos}`, { signal: controle.signal })
    if (resposta.status === 404 || resposta.status === 400) return null
    if (!resposta.ok) throw new Error('Serviço de CNPJ indisponível')
    const dados = await resposta.json()
    return {
      razaoSocial: dados.razao_social ?? '',
      nomeFantasia: dados.nome_fantasia ?? '',
      situacao: dados.descricao_situacao_cadastral ?? '',
      endereco: {
        cep: String(dados.cep ?? '').replace(/^(\d{5})(\d{3})$/, '$1-$2'),
        logradouro: [dados.descricao_tipo_de_logradouro, dados.logradouro].filter(Boolean).join(' '),
        numero: dados.numero ?? '',
        complemento: dados.complemento ?? '',
        bairro: dados.bairro ?? '',
        cidade: dados.municipio ?? '',
        estado: dados.uf ?? null,
      },
      telefones: [dados.ddd_telefone_1, dados.ddd_telefone_2].filter((t) => t && t.trim()),
      email: dados.email ?? '',
    }
  } finally {
    clearTimeout(temporizador)
  }
}
