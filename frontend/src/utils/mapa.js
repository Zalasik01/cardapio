/** Monta o texto de um endereço para busca no mapa. */
function textoEndereco({ rua, numero, complemento, bairro, cidade, estado, cep }) {
  return [[rua, numero].filter(Boolean).join(', '), complemento, bairro, [cidade, estado].filter(Boolean).join(' - '), cep, 'Brasil']
    .filter(Boolean).join(', ')
}

/**
 * Link do Google Maps com a rota da loja até o endereço de entrega do pedido (modo carro). A origem usa a
 * coordenada da loja quando ela existe; o destino usa o endereço digitado no pedido. Sem rua/bairro no pedido,
 * devolve null.
 */
export function rotaGoogleMaps(loja, pedido) {
  if (!pedido.enderecoRua && !pedido.enderecoBairro) return null
  const origem = loja?.latitude != null && loja?.longitude != null
    ? `${loja.latitude},${loja.longitude}`
    : textoEndereco({
      rua: loja?.enderecoRua, numero: loja?.enderecoNumero, bairro: loja?.enderecoBairro,
      cidade: loja?.enderecoCidade, estado: loja?.enderecoEstado, cep: loja?.enderecoCep,
    })
  const destino = textoEndereco({
    rua: pedido.enderecoRua, numero: pedido.enderecoNumero, bairro: pedido.enderecoBairro, cidade: pedido.enderecoCidade,
  })
  const parametros = new URLSearchParams({ api: '1', destination: destino, travelmode: 'driving' })
  if (origem.replace(/[,\s]|Brasil/g, '')) parametros.set('origin', origem)
  return `https://www.google.com/maps/dir/?${parametros.toString()}`
}
