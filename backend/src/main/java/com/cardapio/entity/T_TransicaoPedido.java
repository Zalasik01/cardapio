package com.cardapio.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * Passagem permitida de uma situação para outra. tipoPedido restringe a passagem a entrega ou retirada
 * (nulo = vale para os dois). rotulo é o texto do botão no painel (vazio = nome da situação de destino).
 * Cancelar não precisa de transição: é sempre possível enquanto o pedido não terminou.
 */
@Entity
@Table(name = "t_transicao_pedido")
@AttributeOverride(name = "id", column = @Column(name = "id_transicao_pedido"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class T_TransicaoPedido extends TenantAbstract {

    @Column(name = "id_de", nullable = false)
    private Long idDe;

    @Column(name = "id_para", nullable = false)
    private Long idPara;

    @Enumerated(EnumType.STRING)
    private TipoEntrega tipoPedido;

    private String rotulo;
}
