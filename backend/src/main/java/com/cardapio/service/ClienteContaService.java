package com.cardapio.service;

import com.cardapio.entity.S_ClienteConta;
import com.cardapio.entity.S_ClienteOtp;
import com.cardapio.exception.RegraNegocioException;
import com.cardapio.repository.S_ClienteContaRepository;
import com.cardapio.repository.S_ClienteOtpRepository;
import com.cardapio.security.JwtService;
import io.jsonwebtoken.JwtException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Conta do cliente final. Entra só com o telefone: o sistema envia um código (OTP) e, ao confirmá-lo, cria a conta
 * (se for a primeira vez) e devolve um token próprio (que não vale no painel). O código nunca é guardado, só o hash.
 */
@Service
@RequiredArgsConstructor
public class ClienteContaService {

    private static final int VALIDADE_MINUTOS = 5;
    private static final int MAX_TENTATIVAS = 5;
    private static final int MAX_ENVIOS_POR_HORA = 5;
    private static final int INTERVALO_MIN_SEGUNDOS = 30;

    private final S_ClienteContaRepository contaRepository;
    private final S_ClienteOtpRepository otpRepository;
    private final ProvedorOtp provedor;
    private final JwtService jwtService;

    @Value("${app.jwt.secret}")
    private String segredo;

    /** Em desenvolvimento o código volta na resposta (não há WhatsApp/SMS ligado). Desligar em produção. */
    @Value("${app.otp.exibir-codigo:true}")
    private boolean exibirCodigo;

    private final SecureRandom aleatorio = new SecureRandom();

    public record CodigoEnviado(int expiraEmSegundos, String codigoDev) {
    }

    public record Sessao(String token, ContaResponse cliente) {
    }

    public record ContaResponse(Long id, String nome, String telefone) {
        static ContaResponse of(S_ClienteConta c) {
            return new ContaResponse(c.getId(), c.getNome(), c.getTelefone());
        }
    }

    /** Só os dígitos, sem o 55 do país; precisa ter DDD + número (10 ou 11 dígitos). */
    public static String normalizarTelefone(String bruto) {
        String d = bruto == null ? "" : bruto.replaceAll("\\D", "");
        if (d.length() > 11 && d.startsWith("55")) {
            d = d.substring(2);
        }
        if (d.length() < 10 || d.length() > 11) {
            throw new RegraNegocioException("Informe o telefone com DDD");
        }
        return d;
    }

    @Transactional
    public CodigoEnviado solicitarCodigo(String telefoneBruto) {
        String telefone = normalizarTelefone(telefoneBruto);
        LocalDateTime agora = LocalDateTime.now();
        otpRepository.findFirstByTelefoneOrderByDataCriacaoDesc(telefone).ifPresent(ultimo -> {
            if (ultimo.getDataCriacao().isAfter(agora.minusSeconds(INTERVALO_MIN_SEGUNDOS))) {
                throw new RegraNegocioException("Aguarde alguns segundos para pedir um novo código");
            }
        });
        if (otpRepository.countByTelefoneAndDataCriacaoAfter(telefone, agora.minusHours(1)) >= MAX_ENVIOS_POR_HORA) {
            throw new RegraNegocioException("Muitos códigos pedidos para este telefone. Tente novamente mais tarde");
        }
        String codigo = String.format("%06d", aleatorio.nextInt(1_000_000));
        otpRepository.save(S_ClienteOtp.builder().telefone(telefone).codigoHash(hash(telefone, codigo))
                .expiraEm(agora.plusMinutes(VALIDADE_MINUTOS)).tentativas(0).usado(false).dataCriacao(agora).build());
        provedor.enviar(telefone, codigo);
        return new CodigoEnviado(VALIDADE_MINUTOS * 60, exibirCodigo ? codigo : null);
    }

    @Transactional(noRollbackFor = RegraNegocioException.class)
    public Sessao verificar(String telefoneBruto, String codigo, String nome) {
        String telefone = normalizarTelefone(telefoneBruto);
        S_ClienteOtp otp = otpRepository.findFirstByTelefoneAndUsadoFalseOrderByDataCriacaoDesc(telefone)
                .filter(o -> o.getExpiraEm().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> new RegraNegocioException("Código expirado. Peça um novo"));
        if (otp.getTentativas() >= MAX_TENTATIVAS) {
            throw new RegraNegocioException("Muitas tentativas. Peça um novo código");
        }
        otp.setTentativas(otp.getTentativas() + 1);
        boolean confere = codigo != null && MessageDigest.isEqual(
                hash(telefone, codigo.trim()).getBytes(StandardCharsets.UTF_8), otp.getCodigoHash().getBytes(StandardCharsets.UTF_8));
        if (!confere) {
            otpRepository.save(otp);
            throw new RegraNegocioException("Código incorreto");
        }
        otp.setUsado(true);
        otpRepository.save(otp);

        S_ClienteConta conta = contaRepository.findByTelefoneAndDeletadoFalse(telefone).orElseGet(
                () -> S_ClienteConta.builder().telefone(telefone).dataCriacao(LocalDateTime.now()).build());
        if ((conta.getNome() == null || conta.getNome().isBlank()) && nome != null && !nome.isBlank()) {
            conta.setNome(nome.trim());
        }
        conta.setUltimoAcesso(LocalDateTime.now());
        conta = contaRepository.save(conta);
        return new Sessao(jwtService.gerarTokenCliente(conta.getId()), ContaResponse.of(conta));
    }

    /** Conta do token "Bearer ..."; lança JwtException (401) se faltar, estiver vencido ou a conta não existir mais. */
    @Transactional(readOnly = true)
    public S_ClienteConta autenticar(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new JwtException("Entre com seu telefone para continuar");
        }
        Long id = jwtService.lerTokenCliente(authorization.substring(7));
        return contaRepository.findById(id).filter(c -> !c.isDeletado() && c.isAtivo())
                .orElseThrow(() -> new JwtException("Conta não encontrada"));
    }

    public ContaResponse resposta(S_ClienteConta conta) {
        return ContaResponse.of(conta);
    }

    @Transactional
    public ContaResponse atualizarNome(S_ClienteConta conta, String nome) {
        if (nome == null || nome.isBlank()) {
            throw new RegraNegocioException("Informe seu nome");
        }
        S_ClienteConta atual = contaRepository.findById(conta.getId()).orElseThrow();
        atual.setNome(nome.trim());
        return ContaResponse.of(contaRepository.save(atual));
    }

    private String hash(String telefone, String codigo) {
        try {
            byte[] h = MessageDigest.getInstance("SHA-256").digest((segredo + ":" + telefone + ":" + codigo).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(h);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
