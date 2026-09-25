package com.cardapio;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CardapioApplication {

    public static void main(String[] args) {
        SpringApplication.run(CardapioApplication.class, args);
    }
}
