import { useRef } from 'react'
import { Button } from 'primereact/button'
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react'
import { useReactToPrint } from 'react-to-print'
import { useAuth } from '../../context/AuthContext'
import { dispatchMsgSuccess } from '../../store/dispatchMsg'

function baixar(href, nome) {
  const a = document.createElement('a')
  a.href = href
  a.download = nome
  a.click()
}

/** Loja > Divulgação: QR Code do cardápio (PNG/SVG) e cartaz para imprimir na mesa, sacola ou vitrine. */
export default function PaginaDivulgacao() {
  const { loja } = useAuth()
  const link = `${window.location.origin}/${loja.slug}`
  const cartaz = useRef(null)
  const canvas = useRef(null)
  const svg = useRef(null)
  const imprimir = useReactToPrint({ contentRef: cartaz, documentTitle: `Cartaz ${loja.nome}` })

  function baixarPng() {
    baixar(canvas.current.querySelector('canvas').toDataURL('image/png'), `qrcode-${loja.slug}.png`)
  }

  function baixarSvg() {
    const xml = new XMLSerializer().serializeToString(svg.current.querySelector('svg'))
    baixar(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`, `qrcode-${loja.slug}.svg`)
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link)
      dispatchMsgSuccess('Link copiado')
    } catch {
      dispatchMsgSuccess(link)
    }
  }

  return (
    <div className="crud divulgacao">
      <div className="crud__cabecalho">
        <div>
          <h1>Divulgação</h1>
          <p className="texto-auxiliar">QR Code do seu cardápio online para mesa, sacola, vitrine e redes sociais.</p>
        </div>
      </div>

      <div className="divulgacao__grade">
        <section className="divulgacao__cartaz-caixa">
          <div ref={cartaz} className="divulgacao__cartaz">
            <h2>{loja.nome}</h2>
            <p>Peça pelo celular</p>
            <div ref={canvas}><QRCodeCanvas value={link} size={280} level="M" marginSize={2} /></div>
            <small>Aponte a câmera para o QR Code</small>
            <code>{link.replace(/^https?:\/\//, '')}</code>
          </div>
        </section>

        <section className="divulgacao__acoes">
          <h3>Link do cardápio</h3>
          <code className="divulgacao__link">{link}</code>
          <Button type="button" label="Copiar link" icon="pi pi-copy" outlined onClick={copiar} />
          <h3>Baixar e imprimir</h3>
          <Button type="button" label="Imprimir cartaz" icon="pi pi-print" onClick={() => imprimir()} />
          <Button type="button" label="Baixar QR Code (PNG)" icon="pi pi-download" outlined onClick={baixarPng} />
          <Button type="button" label="Baixar QR Code (SVG)" icon="pi pi-download" outlined onClick={baixarSvg} />
          <div ref={svg} hidden><QRCodeSVG value={link} size={512} level="M" marginSize={2} /></div>
        </section>
      </div>
    </div>
  )
}
