/**
 * Modo offline da página do entregador: o último painel fica guardado no aparelho e as ações feitas sem internet
 * ("saí para entrega", "entregue" com foto e código) entram numa fila que é enviada, na ordem, quando a conexão volta.
 */
const chavePainel = (token) => `entregador_painel_${token}`
const chaveFila = (token) => `entregador_fila_${token}`

const ler = (chave, padrao) => {
  try {
    return JSON.parse(localStorage.getItem(chave)) ?? padrao
  } catch {
    return padrao
  }
}

const gravar = (chave, valor) => {
  try {
    localStorage.setItem(chave, JSON.stringify(valor))
  } catch {
    // aparelho sem espaço/armazenamento: o que estava só na memória continua valendo até fechar a página
  }
}

export const lerPainelGuardado = (token) => ler(chavePainel(token), null)
export const guardarPainel = (token, painel) => gravar(chavePainel(token), painel)

export const lerFila = (token) => ler(chaveFila(token), [])
export const salvarFila = (token, fila) => gravar(chaveFila(token), fila)

/** A falha foi de rede (sem internet/servidor fora) e não uma resposta de erro do servidor? */
export const ehFalhaDeRede = (erro) => !erro?.response

/** Reduz a foto (lado maior 1024 px, JPEG) e devolve como texto (data URL): cabe na fila e sobe rápido em 4G. */
export function comprimirFoto(arquivo) {
  return new Promise((resolver, rejeitar) => {
    const leitor = new FileReader()
    leitor.onerror = () => rejeitar(new Error('Não foi possível ler a foto'))
    leitor.onload = () => {
      const imagem = new Image()
      imagem.onerror = () => rejeitar(new Error('Foto inválida'))
      imagem.onload = () => {
        const escala = Math.min(1, 1024 / Math.max(imagem.width, imagem.height))
        const tela = document.createElement('canvas')
        tela.width = Math.round(imagem.width * escala)
        tela.height = Math.round(imagem.height * escala)
        tela.getContext('2d').drawImage(imagem, 0, 0, tela.width, tela.height)
        resolver(tela.toDataURL('image/jpeg', 0.72))
      }
      imagem.src = leitor.result
    }
    leitor.readAsDataURL(arquivo)
  })
}

/** data URL -> File (para enviar como multipart). */
export async function dataUrlParaArquivo(dataUrl) {
  const blob = await (await fetch(dataUrl)).blob()
  return new File([blob], 'entrega.jpg', { type: 'image/jpeg' })
}
