import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { InputMask } from 'primereact/inputmask'
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { useAuth } from '../../context/AuthContext'
import { dispatchMsgError, dispatchMsgSuccess } from '../../store/dispatchMsg'
import { confirmar } from '../../utils/confirmar'
import {
  atualizarEntregador, criarEntregador, excluirEntregador, gerarNovoLinkEntregador, obterEntregador,
} from '../../api/entregadoresApi'
import CampoAtivo from '../../components/crud/CampoAtivo'
import { Campo, GradeCampos, SecaoCrud } from '../../components/crud/Campo'
import CrudPagina from '../../components/crud/CrudPagina'
import RodapeCrud from '../../components/crud/RodapeCrud'
import { CrudSkeleton } from '../../components/Skeleton'

const ROTA_LISTA = '/admin/entregadores'
const moeda = { mode: 'currency', currency: 'BRL', locale: 'pt-BR' }
const TIPOS = [{ valor: 'PROPRIO', rotulo: 'Próprio' }, { valor: 'TERCEIRIZADO', rotulo: 'Terceirizado' }]
const FORM_VAZIO = { ativo: true, nome: '', telefone: '', tipo: 'PROPRIO', veiculo: '', repassePorEntrega: 0 }

/** Cadastro de entregador: /admin/entregadores/novo e /admin/entregadores/:id (com o link do celular dele). */
export default function PaginaEntregadorCrud() {
  const { id } = useParams()
  const editando = id !== undefined
  const { loja, pode } = useAuth()
  const navigate = useNavigate()
  const { definirMigalha } = useOutletContext()

  const [form, setForm] = useState(FORM_VAZIO)
  const [token, setToken] = useState(null)
  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    definirMigalha(editando ? 'Editando entregador' : 'Novo entregador')
    return () => definirMigalha(null)
  }, [editando, definirMigalha])

  useEffect(() => {
    if (!editando) return
    setCarregando(true)
    obterEntregador(loja.tenant, id)
      .then((e) => {
        setForm({
          ativo: e.ativo, nome: e.nome, telefone: e.telefone ?? '', tipo: e.tipo, veiculo: e.veiculo ?? '',
          repassePorEntrega: Number(e.repassePorEntrega),
        })
        setToken(e.token)
      })
      .catch((e) => dispatchMsgError(e.mensagem))
      .finally(() => setCarregando(false))
  }, [editando, id, loja.tenant])

  const definir = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }))
  const linkEntregador = token ? `${window.location.origin}/entregador/${token}` : null

  async function handleSubmit(e) {
    e.preventDefault()
    setSalvando(true)
    try {
      if (editando) {
        await atualizarEntregador(loja.tenant, id, form)
        dispatchMsgSuccess('Entregador atualizado com sucesso')
      } else {
        const criado = await criarEntregador(loja.tenant, form)
        dispatchMsgSuccess('Entregador cadastrado com sucesso')
        navigate(`${ROTA_LISTA}/${criado.id}`)
      }
    } catch (e2) {
      dispatchMsgError(e2.mensagem)
    } finally {
      setSalvando(false)
    }
  }

  function handleExcluir() {
    confirmar({
      mensagem: 'Excluir este entregador? Essa ação não pode ser desfeita.',
      aoConfirmar: async () => {
        try {
          await excluirEntregador(loja.tenant, id)
          dispatchMsgSuccess('Entregador excluído com sucesso')
          navigate(ROTA_LISTA)
        } catch (e) {
          dispatchMsgError(e.mensagem)
        }
      },
    })
  }

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(linkEntregador)
      dispatchMsgSuccess('Link copiado. Envie para o celular do entregador.')
    } catch {
      dispatchMsgError('Não foi possível copiar. Selecione o link e copie manualmente.')
    }
  }

  function novoLink() {
    confirmar({
      mensagem: 'Gerar um novo link? O link atual para de funcionar e o entregador precisa abrir o novo.',
      rotuloConfirmar: 'Gerar novo link',
      aoConfirmar: async () => {
        try {
          const atualizado = await gerarNovoLinkEntregador(loja.tenant, id)
          setToken(atualizado.token)
          dispatchMsgSuccess('Novo link gerado')
        } catch (e) {
          dispatchMsgError(e.mensagem)
        }
      },
    })
  }

  const conteudo = (
    <>
      <SecaoCrud id="secao-principal" titulo="Principal">
        <GradeCampos>
          <CampoAtivo valor={form.ativo} aoAlterar={definir('ativo')} />
          <Campo id="nome" rotulo="Nome" obrigatorio tamanho={6}>
            <InputText id="nome" required maxLength={120} value={form.nome} onChange={(e) => definir('nome')(e.target.value)} />
          </Campo>
          <Campo id="telefone" rotulo="Telefone" tamanho={3}>
            <InputMask id="telefone" mask="(99) 99999-9999" autoClear={false} value={form.telefone}
                       onChange={(e) => definir('telefone')(e.target.value ?? '')} />
          </Campo>
          <Campo id="tipo" rotulo="Tipo" obrigatorio tamanho={3}>
            <Dropdown inputId="tipo" value={form.tipo} options={TIPOS} optionLabel="rotulo" optionValue="valor"
                      onChange={(e) => definir('tipo')(e.value)} />
          </Campo>
          <Campo id="veiculo" rotulo="Veículo" tamanho={6} ajuda="Aparece para o cliente no acompanhamento do pedido (ex.: Moto CG 160).">
            <InputText id="veiculo" maxLength={60} value={form.veiculo} onChange={(e) => definir('veiculo')(e.target.value)} />
          </Campo>
          <Campo id="repasse" rotulo="Repasse por entrega" tamanho={3} ajuda="Quanto ele recebe a cada entrega concluída.">
            <InputNumber inputId="repasse" value={form.repassePorEntrega} min={0} {...moeda}
                         onValueChange={(e) => definir('repassePorEntrega')(e.value ?? 0)} />
          </Campo>
        </GradeCampos>
      </SecaoCrud>

      {editando && linkEntregador && (
        <SecaoCrud id="secao-link" titulo="Link do celular do entregador">
          <p className="texto-auxiliar">
            Envie este link (ou peça para ele ler o QR Code). Ao abrir no celular, ele vê só as entregas dele, pode abrir a rota,
            marcar a saída e concluir com foto, e ainda instalar como aplicativo. Não compartilhe com outras pessoas.
          </p>
          <div className="entregador__link">
            <QRCodeSVG value={linkEntregador} size={132} marginSize={2} />
            <div className="entregador__link-dados">
              <InputText readOnly value={linkEntregador} aria-label="Link do entregador" onFocus={(e) => e.target.select()} />
              <div className="entregador__link-botoes">
                <Button type="button" icon="pi pi-copy" label="Copiar link" outlined onClick={copiarLink} />
                {pode('ENTREGADORES_ALTERAR') && (
                  <Button type="button" icon="pi pi-refresh" label="Gerar novo link" severity="secondary" outlined onClick={novoLink} />
                )}
              </div>
            </div>
          </div>
        </SecaoCrud>
      )}
    </>
  )

  return (
    <form onSubmit={handleSubmit}>
      <CrudPagina
        somenteLeitura={!pode(editando ? 'ENTREGADORES_ALTERAR' : 'ENTREGADORES_INCLUIR')}
        titulo={editando ? (carregando ? 'Entregador' : form.nome) : 'Novo entregador'}
        subtitulo={editando ? 'Editar entregador' : 'Cadastro de entregador'}
        aoVoltar={() => navigate(ROTA_LISTA)}
        rodape={(
          <RodapeCrud editando={editando} carregando={carregando} salvando={salvando} aoExcluir={handleExcluir}
                      podeExcluir={pode('ENTREGADORES_EXCLUIR')} podeSalvar={pode(editando ? 'ENTREGADORES_ALTERAR' : 'ENTREGADORES_INCLUIR')}
                      aoFechar={() => navigate(ROTA_LISTA)} />
        )}
      >
        {carregando ? <CrudSkeleton blocos={[[6, 3, 3, 6, 3], [12]]} /> : conteudo}
      </CrudPagina>
    </form>
  )
}
