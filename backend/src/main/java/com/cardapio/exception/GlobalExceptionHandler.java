package com.cardapio.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import lombok.extern.slf4j.Slf4j;
import io.jsonwebtoken.JwtException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ResponseEntity<ErroResposta> handleNaoEncontrado(RecursoNaoEncontradoException ex) {
        return construirResposta(HttpStatus.NOT_FOUND, ex.getMessage(), null);
    }

    @ExceptionHandler(RegraNegocioException.class)
    public ResponseEntity<ErroResposta> handleRegraNegocio(RegraNegocioException ex) {
        return construirResposta(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage(), null);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErroResposta> handleCredenciaisInvalidas(BadCredentialsException ex) {
        return construirResposta(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos", null);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErroResposta> handleAutenticacao(AuthenticationException ex) {
        return construirResposta(HttpStatus.UNAUTHORIZED, "Não foi possível autenticar", null);
    }

    @ExceptionHandler(JwtException.class)
    public ResponseEntity<ErroResposta> handleTokenInvalido(JwtException ex) {
        return construirResposta(HttpStatus.UNAUTHORIZED, "Sessão inválida ou expirada", null);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErroResposta> handleAcessoNegado(AccessDeniedException ex) {
        return construirResposta(HttpStatus.FORBIDDEN, "Acesso negado", null);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErroResposta> handleCorpoInvalido(HttpMessageNotReadableException ex) {
        return construirResposta(HttpStatus.BAD_REQUEST, "Requisição inválida: corpo ausente ou mal formatado", null);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErroResposta> handleRotaInexistente(NoResourceFoundException ex) {
        return construirResposta(HttpStatus.NOT_FOUND, "Recurso não encontrado", null);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErroResposta> handleArquivoGrande(MaxUploadSizeExceededException ex) {
        return construirResposta(HttpStatus.PAYLOAD_TOO_LARGE, "Arquivo muito grande (máximo 2 MB)", null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroResposta> handleValidacao(MethodArgumentNotValidException ex) {
        Map<String, String> campos = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(erro ->
                campos.put(erro.getField(), erro.getDefaultMessage()));
        return construirResposta(HttpStatus.BAD_REQUEST, "Dados inválidos", campos);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErroResposta> handleTipoInvalido(MethodArgumentTypeMismatchException ex) {
        return construirResposta(HttpStatus.BAD_REQUEST, "Valor inválido para o parâmetro '" + ex.getName() + "'", null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErroResposta> handleGenerica(Exception ex) {
        log.error("Erro não tratado", ex);
        return construirResposta(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno no servidor", null);
    }

    private ResponseEntity<ErroResposta> construirResposta(HttpStatus status, String mensagem, Map<String, String> campos) {
        ErroResposta erro = new ErroResposta(Instant.now(), status.value(), status.getReasonPhrase(), mensagem, campos);
        return ResponseEntity.status(status).body(erro);
    }
}
