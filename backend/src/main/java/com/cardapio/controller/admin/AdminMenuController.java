package com.cardapio.controller.admin;

import com.cardapio.dto.menu.CategoriaMenuResponse;
import com.cardapio.security.AppUserDetails;
import com.cardapio.service.MenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/menu")
@RequiredArgsConstructor
public class AdminMenuController {

    private final MenuService menuService;

    @GetMapping
    public List<CategoriaMenuResponse> listar(@AuthenticationPrincipal AppUserDetails usuario) {
        return menuService.montarMenu(usuario);
    }
}
