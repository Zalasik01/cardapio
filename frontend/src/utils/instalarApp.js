import { useEffect, useState } from 'react'

/**
 * Instalação do cardápio como aplicativo (PWA). O navegador dispara "beforeinstallprompt" uma vez, às vezes antes de
 * a tela existir, então o evento é guardado aqui, no carregamento do módulo. No iPhone não há esse evento: a instalação
 * é manual (Compartilhar > Adicionar à Tela de Início) e mostramos a instrução.
 */
let adiado = null
const ouvintes = new Set()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    adiado = e
    ouvintes.forEach((f) => f())
  })
  window.addEventListener('appinstalled', () => {
    adiado = null
    ouvintes.forEach((f) => f())
  })
}

const jaInstalado = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
const ehIphone = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream

export function useInstalarApp() {
  const [, atualizar] = useState(0)
  useEffect(() => {
    const f = () => atualizar((n) => n + 1)
    ouvintes.add(f)
    return () => ouvintes.delete(f)
  }, [])

  const instalado = jaInstalado()
  return {
    /** Mostra o botão: o navegador oferece a instalação, ou é iPhone (instrução manual) e ainda não está instalado. */
    podeInstalar: !instalado && (adiado !== null || ehIphone()),
    ehIphone: ehIphone(),
    async instalar() {
      if (!adiado) return false
      adiado.prompt()
      const escolha = await adiado.userChoice
      adiado = null
      ouvintes.forEach((f) => f())
      return escolha.outcome === 'accepted'
    },
  }
}
