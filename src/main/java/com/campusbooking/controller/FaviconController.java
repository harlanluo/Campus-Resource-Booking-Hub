package com.campusbooking.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
public class FaviconController {

    /** Redirect older browser favicon requests to the current local SVG asset. */
    @GetMapping("/favicon.ico")
    public ResponseEntity<Void> legacyFaviconRequest() {
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, URI.create("/favicon.svg").toString())
                .build();
    }
}
