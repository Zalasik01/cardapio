import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { buscarCoordenadas } from '../api/cepApi'

const VELOCIDADE_MEDIA_KMH = 25 // reserva, quando o serviço de rotas não responde

/** Ícones do mapa (ícone de HTML, sem imagens: evita o problema clássico dos ícones do Leaflet com bundlers). */
const iconeMoto = L.divIcon({ className: 'mapa-pino mapa-pino--moto', html: '<i class="fa-solid fa-motorcycle"></i>', iconSize: [40, 40], iconAnchor: [20, 20] })
const iconeCasa = L.divIcon({ className: 'mapa-pino mapa-pino--casa', html: '<i class="fa-solid fa-house"></i>', iconSize: [36, 36], iconAnchor: [18, 32] })

function distanciaKm(a, b) {
  const rad = (g) => (g * Math.PI) / 180
  const dLat = rad(b[0] - a[0])
  const dLng = rad(b[1] - a[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

/** Rota de carro entre dois pontos no OSRM (serviço público e gratuito); devolve { pontos, minutos, km } ou null. */
async function buscarRota(de, para) {
  try {
    const resposta = await fetch(`https://router.project-osrm.org/route/v1/driving/${de[1]},${de[0]};${para[1]},${para[0]}?overview=full&geometries=geojson`)
    if (!resposta.ok) return null
    const dados = await resposta.json()
    const rota = dados.routes?.[0]
    if (!rota) return null
    return { pontos: rota.geometry.coordinates.map(([lng, lat]) => [lat, lng]), minutos: Math.max(1, Math.round(rota.duration / 60)), km: rota.distance / 1000 }
  } catch {
    return null
  }
}

/** Enquadra o mapa no caminho inteiro (moto, destino e rota) sempre que eles mudam. */
function Enquadrar({ pontos }) {
  const mapa = useMap()
  const chave = pontos.map((p) => p.join(',')).join('|')
  useEffect(() => {
    if (pontos.length > 1) mapa.fitBounds(L.latLngBounds(pontos), { padding: [36, 36], maxZoom: 17 })
    else if (pontos.length === 1) mapa.setView(pontos[0], 16)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, mapa])
  return null
}

/**
 * Mapa do acompanhamento: onde o entregador está, o caminho que já fez (cinza), o que falta até a casa (azul) e a
 * estimativa de chegada (aoEstimar recebe { minutos, km }). O destino vem do pedido; sem coordenadas, é procurado pelo
 * bairro e cidade.
 */
export default function MapaAcompanhamento({ entregador, destino, destinoTexto, trilha, aoEstimar }) {
  const moto = useMemo(() => [entregador.latitude, entregador.longitude], [entregador.latitude, entregador.longitude])
  const [coordDestino, setCoordDestino] = useState(destino ? [destino.latitude, destino.longitude] : null)
  const [rota, setRota] = useState(null)
  const estimar = useRef(aoEstimar)
  estimar.current = aoEstimar

  useEffect(() => {
    if (destino) {
      setCoordDestino([destino.latitude, destino.longitude])
      return
    }
    if (!destinoTexto) return
    const [bairro, cidade] = destinoTexto.split(' - ')
    buscarCoordenadas({ bairro, cidade }).then((c) => c && setCoordDestino([c.latitude, c.longitude]))
  }, [destino, destinoTexto])

  useEffect(() => {
    if (!coordDestino) return undefined
    let cancelado = false
    buscarRota(moto, coordDestino).then((r) => {
      if (cancelado) return
      const km = r?.km ?? distanciaKm(moto, coordDestino) * 1.3
      const resultado = r ?? { pontos: [moto, coordDestino], minutos: Math.max(1, Math.round((km / VELOCIDADE_MEDIA_KMH) * 60)), km }
      setRota(resultado)
      estimar.current?.({ minutos: resultado.minutos, km: resultado.km })
    })
    return () => { cancelado = true }
  }, [moto, coordDestino])

  const percorrido = (trilha ?? []).map((p) => [p.latitude, p.longitude])
  const enquadrar = [moto, ...(coordDestino ? [coordDestino] : []), ...(rota ? rota.pontos : [])]

  return (
    <div className="pedido-mapa">
      <MapContainer center={moto} zoom={15} scrollWheelZoom={false} className="pedido-mapa__leaflet" attributionControl>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
        {percorrido.length > 1 && <Polyline positions={percorrido} pathOptions={{ color: '#9ca3af', weight: 5, opacity: 0.9 }} />}
        {rota && <Polyline positions={rota.pontos} pathOptions={{ color: '#dc2626', weight: 5, dashArray: '2 10', lineCap: 'round' }} />}
        {coordDestino && <Marker position={coordDestino} icon={iconeCasa} />}
        <Marker position={moto} icon={iconeMoto} />
        <Enquadrar pontos={enquadrar} />
      </MapContainer>
      <div className="pedido-mapa__legenda">
        <span><i className="fa-solid fa-grip-lines" style={{ color: '#9ca3af' }} /> já percorrido</span>
        <span><i className="fa-solid fa-ellipsis" style={{ color: '#dc2626' }} /> falta até você</span>
      </div>
    </div>
  )
}
