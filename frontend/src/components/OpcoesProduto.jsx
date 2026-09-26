import { formatarMoeda } from '../utils/formatadores'

/**
 * Grupos de adicionais e variações de um produto (tamanho, adicionais, ponto da carne...): escolha única (bolinha) quando o
 * máximo é 1 e múltipla (caixa) nos demais, com o mínimo/máximo de cada grupo à vista. Quem usa guarda os ids marcados.
 *
 * Props: grupos, valor (ids marcados), aoAlterar(ids), mostrarErro (destaca os grupos obrigatórios ainda vazios).
 */
export default function OpcoesProduto({ grupos, valor, aoAlterar, mostrarErro = false }) {
  const marcados = new Set(valor)

  function alternar(grupo, opcao) {
    const doGrupo = grupo.opcoes.map((o) => o.id)
    const ja = marcados.has(opcao.id)
    let proximos
    if (grupo.maximo === 1) {
      // escolha única: trocar a opção (e, num grupo opcional, tocar de novo desmarca)
      proximos = valor.filter((id) => !doGrupo.includes(id))
      if (!ja) proximos.push(opcao.id)
      else if (grupo.minimo >= 1) proximos.push(opcao.id)
    } else {
      proximos = ja ? valor.filter((id) => id !== opcao.id) : [...valor, opcao.id]
    }
    aoAlterar(proximos)
  }

  return (
    <div className="opcoes-produto">
      {grupos.map((g) => {
        const qtd = g.opcoes.filter((o) => marcados.has(o.id)).length
        const faltando = mostrarErro && qtd < g.minimo
        const cheio = g.maximo > 1 && qtd >= g.maximo
        return (
          <fieldset key={g.id} className={`opcoes-produto__grupo${faltando ? ' opcoes-produto__grupo--erro' : ''}`}>
            <legend>
              <strong>{g.nome}</strong>
              <span className={g.minimo > 0 ? 'obrigatorio' : ''}>
                {g.minimo > 0 ? 'Obrigatório' : g.maximo === 1 ? 'Opcional' : `Até ${g.maximo}`}
              </span>
            </legend>
            {g.descricao && <small>{g.descricao}</small>}
            {g.opcoes.map((o) => {
              const ativo = marcados.has(o.id)
              const bloqueada = !o.disponivel || (cheio && !ativo && g.maximo > 1)
              return (
                <label key={o.id} className={`opcoes-produto__opcao${ativo ? ' ativo' : ''}${bloqueada ? ' bloqueada' : ''}`}>
                  <input type={g.maximo === 1 ? 'radio' : 'checkbox'} name={`grupo-${g.id}`} checked={ativo} disabled={bloqueada}
                         onChange={() => alternar(g, o)} onClick={() => g.maximo === 1 && ativo && g.minimo === 0 && alternar(g, o)} />
                  <span>{o.nome}{!o.disponivel && <em> (esgotado)</em>}</span>
                  {Number(o.preco) > 0 && <strong>+ {formatarMoeda(o.preco)}</strong>}
                </label>
              )
            })}
            {faltando && <p role="alert">Escolha {g.minimo === 1 ? 'uma opção' : `pelo menos ${g.minimo}`}.</p>}
          </fieldset>
        )
      })}
    </div>
  )
}
