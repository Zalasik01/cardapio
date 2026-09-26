import { useRef, useState } from 'react'
import { Dropdown } from 'primereact/dropdown'
import { InputMask } from 'primereact/inputmask'
import { InputText } from 'primereact/inputtext'
import { buscarEnderecoPorCep } from '../../api/cepApi'
import { UFS } from '../../utils/pessoa'
import { Campo, GradeCampos, SecaoCrud } from './Campo'

/**
 * Bloco "Endereço" dos cadastros (funcionário, cliente/fornecedor, loja...): CEP, logradouro, número,
 * complemento, bairro, cidade e UF. Ao completar o CEP, preenche logradouro, bairro, cidade e UF
 * pelo ViaCEP (número e complemento continuam manuais).
 *
 * Props: endereco { cep, logradouro, numero, complemento, bairro, cidade, estado } e
 * aoAlterar(campos | (atual) => campos), que mescla os campos no endereço do formulário. semComplemento esconde
 * o campo de complemento (quando o cadastro não guarda esse dado, como a loja).
 */
export default function Endereco({ endereco, aoAlterar, semComplemento = false, prefixo = '', semSecao = false, titulo = 'Endereço' }) {
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [avisoCep, setAvisoCep] = useState(null)
  const numeroRef = useRef(null)
  const consultaCep = useRef(0) // ignora respostas de consultas antigas

  const definir = (campo) => (valor) => aoAlterar({ [campo]: valor })
  const Corpo = ({ children }) => (semSecao ? <>{children}</> : <SecaoCrud id="secao-endereco" titulo={titulo}>{children}</SecaoCrud>)

  async function preencherPorCep(cep) {
    const consulta = ++consultaCep.current
    setAvisoCep(null)
    setBuscandoCep(true)
    try {
      const encontrado = await buscarEnderecoPorCep(cep)
      if (consulta !== consultaCep.current) return
      if (!encontrado) {
        setAvisoCep('CEP não encontrado. Preencha o endereço manualmente.')
        return
      }
      aoAlterar((atual) => ({
        logradouro: encontrado.logradouro || atual.logradouro,
        bairro: encontrado.bairro || atual.bairro,
        cidade: encontrado.cidade || atual.cidade,
        estado: encontrado.estado || atual.estado,
        complemento: atual.complemento || encontrado.complemento,
      }))
      numeroRef.current?.focus()
    } catch {
      if (consulta === consultaCep.current) {
        setAvisoCep('Não foi possível consultar o CEP agora. Preencha o endereço manualmente.')
      }
    } finally {
      if (consulta === consultaCep.current) setBuscandoCep(false)
    }
  }

  return (
    <Corpo>
      <GradeCampos>
        <Campo id={`${prefixo}cep`} rotulo="CEP" tamanho={2} ajuda={buscandoCep ? 'Buscando endereço...' : avisoCep}>
          <InputMask id={`${prefixo}cep`} mask="99999-999" autoClear={false} value={endereco.cep}
                     onChange={(e) => definir('cep')(e.target.value ?? '')}
                     onComplete={(e) => preencherPorCep(e.value)} />
        </Campo>
        <Campo id={`${prefixo}logradouro`} rotulo="Logradouro" tamanho={semComplemento ? 6 : 5}>
          <InputText id={`${prefixo}logradouro`} maxLength={255} value={endereco.logradouro}
                     onChange={(e) => definir('logradouro')(e.target.value)} />
        </Campo>
        <Campo id={`${prefixo}numero`} rotulo="Número" tamanho={2}>
          <InputText id={`${prefixo}numero`} ref={numeroRef} maxLength={20} value={endereco.numero}
                     onChange={(e) => definir('numero')(e.target.value)} />
        </Campo>
        {!semComplemento && (
          <Campo id={`${prefixo}complemento`} rotulo="Complemento" tamanho={3}>
            <InputText id={`${prefixo}complemento`} maxLength={255} value={endereco.complemento}
                       onChange={(e) => definir('complemento')(e.target.value)} />
          </Campo>
        )}
        <Campo id={`${prefixo}bairro`} rotulo="Bairro" tamanho={semComplemento ? 4 : 5}>
          <InputText id={`${prefixo}bairro`} maxLength={255} value={endereco.bairro}
                     onChange={(e) => definir('bairro')(e.target.value)} />
        </Campo>
        <Campo id={`${prefixo}cidade`} rotulo="Cidade" tamanho={semComplemento ? 4 : 5}>
          <InputText id={`${prefixo}cidade`} maxLength={255} value={endereco.cidade}
                     onChange={(e) => definir('cidade')(e.target.value)} />
        </Campo>
        <Campo id={`${prefixo}uf`} rotulo="Estado" tamanho={semComplemento ? 4 : 2}>
          <Dropdown inputId={`${prefixo}uf`} value={endereco.estado} options={UFS} optionLabel="rotulo" optionValue="valor"
                    showClear filter placeholder="UF" onChange={(e) => definir('estado')(e.value ?? null)} />
        </Campo>
      </GradeCampos>
    </Corpo>
  )
}
