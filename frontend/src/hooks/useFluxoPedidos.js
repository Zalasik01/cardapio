import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { obterFluxo } from '../api/fluxoApi'

/** Situações do fluxo de pedidos da loja (null enquanto carrega). recarregar() consulta de novo. */
export default function useFluxoPedidos() {
  const { loja } = useAuth()
  const [fluxo, setFluxo] = useState(null)

  useEffect(() => {
    let descartada = false
    obterFluxo(loja.tenant).then((dados) => !descartada && setFluxo(dados)).catch(() => !descartada && setFluxo({ situacoes: [], transicoes: [] }))
    return () => {
      descartada = true
    }
  }, [loja.tenant])

  return fluxo
}
