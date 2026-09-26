import { useEffect, useState } from 'react'
import { Dialog } from 'primereact/dialog'
import { listarEnderecosCliente, removerEnderecoCliente, salvarEnderecoCliente } from '../api/cardapioApi'
import { buscarCoordenadas, buscarEnderecoPorCep } from '../api/cepApi'
import { mascaraCep } from '../utils/telefone'

const VAZIO = { apelido: '', cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '' }

/** Formulário de novo endereço: o CEP preenche rua, bairro e cidade; as coordenadas (para frete e mapa) são buscadas ao salvar. */
function DialogoEndereco({ aoFechar, aoSalvo }) {
  const [form, setForm] = useState(VAZIO)
  const [buscando, setBuscando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const campo = (nome) => (e) => setForm((atual) => ({ ...atual, [nome]: e.target.value }))

  async function aoDigitarCep(e) {
    const cep = mascaraCep(e.target.value)
    setForm((atual) => ({ ...atual, cep }))
    if (cep.replace(/\D/g, '').length !== 8) return
    setBuscando(true)
    setErro(null)
    try {
      const achado = await buscarEnderecoPorCep(cep)
      if (achado) setForm((atual) => ({ ...atual, rua: achado.logradouro, bairro: achado.bairro, cidade: achado.cidade, estado: achado.estado }))
      else setErro('CEP não encontrado. Preencha o endereço à mão.')
    } catch {
      setErro('Não foi possível buscar o CEP agora. Preencha à mão.')
    } finally {
      setBuscando(false)
    }
  }

  async function salvar(e) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    try {
      const coordenadas = await buscarCoordenadas({ rua: form.rua, bairro: form.bairro, cidade: form.cidade, estado: form.estado })
      const salvo = await salvarEnderecoCliente({ ...form, ...coordenadas })
      aoSalvo(salvo)
    } catch (err) {
      setErro(err.mensagem || 'Não foi possível salvar o endereço.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog visible header="Novo endereço" onHide={aoFechar} className="loja-dialogo" dismissableMask draggable={false} style={{ width: 'min(28rem, 96vw)' }}>
      <form className="loja-login" onSubmit={salvar}>
        <label className="loja-campo">Nome do endereço
          <input required maxLength={40} placeholder="Casa, Trabalho..." value={form.apelido} onChange={campo('apelido')} />
        </label>
        <label className="loja-campo">CEP
          <input inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={form.cep} onChange={aoDigitarCep} />
          {buscando && <small>Buscando endereço...</small>}
        </label>
        <label className="loja-campo">Rua
          <input required value={form.rua} onChange={campo('rua')} />
        </label>
        <div className="loja-linha">
          <label className="loja-campo">Número
            <input required value={form.numero} onChange={campo('numero')} />
          </label>
          <label className="loja-campo">Complemento
            <input value={form.complemento} onChange={campo('complemento')} />
          </label>
        </div>
        <div className="loja-linha">
          <label className="loja-campo">Bairro
            <input required value={form.bairro} onChange={campo('bairro')} />
          </label>
          <label className="loja-campo">Cidade
            <input value={form.cidade} onChange={campo('cidade')} />
          </label>
        </div>
        {erro && <p className="loja__erro" role="alert">{erro}</p>}
        <button type="submit" className="loja-botao" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar endereço'}</button>
      </form>
    </Dialog>
  )
}

/** "Meus endereços" no perfil do cliente: lista, adiciona e remove os endereços salvos (usados no checkout). */
export default function EnderecosCliente() {
  const [enderecos, setEnderecos] = useState(null)
  const [novo, setNovo] = useState(false)
  const [confirmando, setConfirmando] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    listarEnderecosCliente().then(setEnderecos).catch((e) => setErro(e.mensagem))
  }, [])

  async function remover(id) {
    try {
      await removerEnderecoCliente(id)
      setEnderecos((atual) => atual.filter((e) => e.id !== id))
      setConfirmando(null)
    } catch (e) {
      setErro(e.mensagem || 'Não foi possível remover o endereço.')
    }
  }

  return (
    <section id="enderecos" className="cliente-enderecos" aria-label="Meus endereços">
      <header>
        <h2><i className="fa-solid fa-location-dot" aria-hidden="true" /> Meus endereços</h2>
        <button type="button" className="loja-link" onClick={() => setNovo(true)}><i className="fa-solid fa-plus" aria-hidden="true" /> Adicionar</button>
      </header>
      {erro && <p className="loja__erro" role="alert">{erro}</p>}
      {enderecos === null && !erro && <p className="texto-suave">Carregando...</p>}
      {enderecos?.length === 0 && <p className="texto-suave">Você ainda não salvou nenhum endereço. Salve um para pedir mais rápido.</p>}
      <ul>
        {enderecos?.map((e) => (
          <li key={e.id}>
            <span className="cliente-enderecos__icone" aria-hidden="true"><i className="fa-solid fa-house" /></span>
            <div>
              <strong>{e.apelido}</strong>
              <small>{e.rua}, {e.numero}{e.complemento ? ` — ${e.complemento}` : ''}</small>
              <small>{e.bairro}{e.cidade ? `, ${e.cidade}` : ''}</small>
            </div>
            {confirmando === e.id ? (
              <span className="cliente-enderecos__confirma">
                <button type="button" className="loja-link" onClick={() => remover(e.id)}>Remover</button>
                <button type="button" className="loja-link loja-link--suave" onClick={() => setConfirmando(null)}>Não</button>
              </span>
            ) : (
              <button type="button" className="cliente-enderecos__remover" aria-label={`Remover endereço ${e.apelido}`} onClick={() => setConfirmando(e.id)}>
                <i className="fa-regular fa-trash-can" aria-hidden="true" />
              </button>
            )}
          </li>
        ))}
      </ul>
      {novo && <DialogoEndereco aoFechar={() => setNovo(false)} aoSalvo={(salvo) => { setEnderecos((atual) => [salvo, ...(atual ?? [])]); setNovo(false) }} />}
    </section>
  )
}
