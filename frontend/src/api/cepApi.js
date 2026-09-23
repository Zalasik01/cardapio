/**
 * Consulta de endereco pelo CEP no ViaCEP (https://viacep.com.br), servico publico e gratuito.
 *
 * Usa fetch direto (e nao a instancia `http` do sistema) de proposito: aquela instancia envia o
 * token de login em toda requisicao, e ele nunca deve ser enviado a um servico de terceiros.
 */
const TEMPO_LIMITE_MS = 6000

/**
 * Devolve { logradouro, complemento, bairro, cidade, estado } ou null se o CEP nao existir.
 * Lanca Error se o servico estiver indisponivel.
 */
export async function buscarEnderecoPorCep(cep, { signal } = {}) {
  const digitos = String(cep ?? '').replace(/\D/g, '')
  if (digitos.length !== 8) return null

  const controle = new AbortController()
  const temporizador = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS)
  signal?.addEventListener('abort', () => controle.abort())

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`, { signal: controle.signal })
    if (!resposta.ok) throw new Error('Servico de CEP indisponivel')
    const dados = await resposta.json()
    if (dados.erro) return null
    return {
      logradouro: dados.logradouro ?? '',
      complemento: dados.complemento ?? '',
      bairro: dados.bairro ?? '',
      cidade: dados.localidade ?? '',
      estado: dados.uf ?? null,
    }
  } finally {
    clearTimeout(temporizador)
  }
}
