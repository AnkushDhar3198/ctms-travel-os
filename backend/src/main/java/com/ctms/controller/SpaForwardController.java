package com.ctms.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    /**
     * Forwards non-API and non-static file requests to Angular's index.html
     */
    @GetMapping(value = {
            "/{path:[^\\.]*}",
            "/*/{path:[^\\.]*}",
            "/*/*/{path:[^\\.]*}"
    })
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}
