import http from './http'
import { buscarCoordenadas } from './cepApi'

export const buscarCardapio = (slug) =>
  http.get(`/publico/lojas/${slug}/cardapio`).then((res) => res.data)

export const calcularFrete = ({ tenant, bairro, latitude, longitude }) =>
  http
    .post('/publico/frete/calcular', { tenant, bairro, latitude, longitude })
    .then((res) => res.data)

export const criarPedido = (pedido) => http.post('/pedidos', pedido).then((res) => res.data)

export const buscarPedido = (guid) => http.get(`/pedidos/${guid}`).then((res) => res.data)

/**
 * Frete de um endereço: pela zona do bairro; sem zona cadastrada, pela distância, usando as coordenadas do endereço
 * (buscadas no mapa). Devolve o mesmo formato de calcularFrete.
 */
export async function calcularFreteEndereco({ tenant, rua, bairro, cidade, estado }) {
  const resultado = await calcularFrete({ tenant, bairro })
  if (resultado.entregavel || resultado.origem !== 'INDISPONIVEL') return resultado
  const coordenadas = await buscarCoordenadas({ rua, bairro, cidade, estado })
  if (!coordenadas) return resultado
  // as coordenadas seguem no resultado: o pedido precisa reenviá-las para o servidor recalcular o mesmo frete
  return { ...(await calcularFrete({ tenant, bairro, ...coordenadas })), ...coordenadas }
}

/** Confere um cupom para o carrinho (precisa estar logado); o desconto final é recalculado pelo servidor no pedido. */
export const validarCupom = ({ tenant, codigo, tipoEntrega, taxaEntrega, itens }) =>
  http.post('/publico/cliente/cupom/validar', { tenant, codigo, tipoEntrega, taxaEntrega, itens }).then((res) => res.data)
