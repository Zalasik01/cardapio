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

/**
 * Coordenadas aproximadas de um endereço no Nominatim (OpenStreetMap), serviço público e gratuito. Tenta do mais
 * específico (rua + bairro) ao mais amplo (bairro, cidade). Devolve { latitude, longitude } ou null.
 */
export async function buscarCoordenadas({ rua, bairro, cidade, estado }) {
  const tentativas = [[rua, bairro, cidade, estado], [bairro, cidade, estado], [cidade, estado]]
  for (const partes of tentativas) {
    const consulta = partes.filter(Boolean).join(', ')
    if (!consulta || !cidade) continue
    try {
      const resposta = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(consulta)}`)
      if (!resposta.ok) continue
      const [achado] = await resposta.json()
      if (achado) return { latitude: Number(achado.lat), longitude: Number(achado.lon) }
    } catch {
      // tenta a próxima consulta
    }
  }
  return null
}
