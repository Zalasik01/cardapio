import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const MODULO_VERSAO = 'virtual:versao-build'
const ID_RESOLVIDO = `\0${MODULO_VERSAO}`

/** Data/hora da última alteração de qualquer arquivo em src/ (a mais recente). */
function ultimaAlteracao(pasta) {
  return readdirSync(pasta, { withFileTypes: true }).reduce((maior, item) => {
    const caminho = join(pasta, item.name)
    const data = item.isDirectory() ? ultimaAlteracao(caminho) : statSync(caminho).mtimeMs
    return Math.max(maior, data)
  }, 0)
}

/**
 * Versão do sistema exibida na tela de login. No build de produção é a data/hora do build; no
 * servidor de desenvolvimento é a da última alteração nos fontes, atualizada a cada edição.
 */
function versaoBuild() {
  let producao = false
  let dataBuild = null
  return {
    name: 'versao-build',
    configResolved(config) {
      producao = config.command === 'build'
      dataBuild = new Date()
    },
    resolveId: (id) => (id === MODULO_VERSAO ? ID_RESOLVIDO : null),
    load(id) {
      if (id !== ID_RESOLVIDO) return null
      const data = producao ? dataBuild : new Date(ultimaAlteracao('src'))
      return `export const dataBuild = ${JSON.stringify(data.toISOString())}`
    },
    // qualquer edição em src/ recalcula a versão (o módulo é invalidado e recarregado)
    handleHotUpdate({ server }) {
      const modulo = server.moduleGraph.getModuleById(ID_RESOLVIDO)
      if (modulo) {
        server.moduleGraph.invalidateModule(modulo)
        return [modulo]
      }
      return undefined
    },
  }
}

export default defineConfig({
  plugins: [react(), versaoBuild()],
  server: {
    port: 5173,
    host: true,
  },
})
