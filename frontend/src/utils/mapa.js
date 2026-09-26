/** Monta o texto de um endereço para busca no mapa. */
function textoEndereco({ rua, numero, complemento, bairro, cidade, estado, cep }) {
  return [[rua, numero].filter(Boolean).join(', '), complemento, bairro, [cidade, estado].filter(Boolean).join(' - '), cep, 'Brasil']
    .filter(Boolean).join(', ')
}

/**
 * Link do Google Maps com a rota da loja até o endereço de entrega do pedido (modo carro). A origem é o endereço
 * cadastrado da loja (só na falta dele usa a coordenada); o destino é o endereço digitado no pedido. Sem rua/bairro no pedido,
 * devolve null.
 */
export function rotaGoogleMaps(loja, pedido) {
  if (!pedido.enderecoRua && !pedido.enderecoBairro) return null
  // o endereço cadastrado vale mais que as coordenadas: elas podem ser de um endereço antigo da loja
  const enderecoLoja = textoEndereco({
    rua: loja?.enderecoRua, numero: loja?.enderecoNumero, bairro: loja?.enderecoBairro,
    cidade: loja?.enderecoCidade, estado: loja?.enderecoEstado, cep: loja?.enderecoCep,
  })
  const temEndereco = enderecoLoja.replace(/[,\s]|Brasil/g, '') !== ''
  const origem = temEndereco || loja?.latitude == null || loja?.longitude == null
    ? enderecoLoja
    : `${loja.latitude},${loja.longitude}`
  const destino = textoEndereco({
    rua: pedido.enderecoRua, numero: pedido.enderecoNumero, bairro: pedido.enderecoBairro,
    cidade: pedido.enderecoCidade || loja?.enderecoCidade,
    // o pedido não guarda o estado: vale o da loja quando a cidade é a mesma
    estado: !pedido.enderecoCidade || pedido.enderecoCidade.toLowerCase() === (loja?.enderecoCidade ?? '').toLowerCase() ? loja?.enderecoEstado : undefined,
  })
  const parametros = new URLSearchParams({ api: '1', destination: destino, travelmode: 'driving' })
  if (origem.replace(/[,\s]|Brasil/g, '')) parametros.set('origin', origem)
  return `https://www.google.com/maps/dir/?${parametros.toString()}`
}
