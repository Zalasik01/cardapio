import { useRef, useState } from 'react'
import { Dropdown } from 'primereact/dropdown'
import { InputMask } from 'primereact/inputmask'
import { InputText } from 'primereact/inputtext'
import { buscarEnderecoPorCep } from '../../api/cepApi'
import { UFS } from '../../utils/pessoa'
import { Campo, GradeCampos, SecaoCrud } from './Campo'

/**
 * Seção "Endereço" dos cadastros de pessoa. Ao completar o CEP, preenche logradouro, bairro,
 * cidade e UF pelo ViaCEP (número e complemento continuam manuais).
 *
 * Props: endereco (estado do formulário), aoAlterar(campos | (atual) => campos), que mescla no endereço,
 * e comComplemento (padrão true): esconde o campo Complemento em cadastros que não o guardam.
 */
export default function SecaoEndereco({ endereco, aoAlterar, comComplemento = true }) {
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [avisoCep, setAvisoCep] = useState(null)
  const numeroRef = useRef(null)
  const consultaCep = useRef(0) // ignora respostas de consultas antigas

  const definir = (campo) => (valor) => aoAlterar({ [campo]: valor })

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
    <SecaoCrud id="secao-endereco" titulo="Endereço">
      <GradeCampos>
        <Campo id="cep" rotulo="CEP" tamanho={2} ajuda={buscandoCep ? 'Buscando endereço...' : avisoCep}>
          <InputMask id="cep" mask="99999-999" autoClear={false} value={endereco.cep}
                     onChange={(e) => definir('cep')(e.target.value ?? '')}
                     onComplete={(e) => preencherPorCep(e.value)} />
        </Campo>
        <Campo id="logradouro" rotulo="Logradouro" tamanho={5}>
          <InputText id="logradouro" maxLength={255} value={endereco.logradouro}
                     onChange={(e) => definir('logradouro')(e.target.value)} />
        </Campo>
        <Campo id="numero" rotulo="Número" tamanho={2}>
          <InputText id="numero" ref={numeroRef} maxLength={20} value={endereco.numero}
                     onChange={(e) => definir('numero')(e.target.value)} />
        </Campo>
        {comComplemento && (
          <Campo id="complemento" rotulo="Complemento" tamanho={3}>
            <InputText id="complemento" maxLength={255} value={endereco.complemento}
                       onChange={(e) => definir('complemento')(e.target.value)} />
          </Campo>
        )}
        <Campo id="bairro" rotulo="Bairro" tamanho={comComplemento ? 5 : 8}>
          <InputText id="bairro" maxLength={255} value={endereco.bairro}
                     onChange={(e) => definir('bairro')(e.target.value)} />
        </Campo>
        <Campo id="cidade" rotulo="Cidade" tamanho={5}>
          <InputText id="cidade" maxLength={255} value={endereco.cidade}
                     onChange={(e) => definir('cidade')(e.target.value)} />
        </Campo>
        <Campo id="uf" rotulo="Estado" tamanho={2}>
          <Dropdown inputId="uf" value={endereco.estado} options={UFS} optionLabel="rotulo" optionValue="valor"
                    showClear filter placeholder="UF" onChange={(e) => definir('estado')(e.value ?? null)} />
        </Campo>
      </GradeCampos>
    </SecaoCrud>
  )
}
