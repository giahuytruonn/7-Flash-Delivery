package com.sevenelevenvn;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableCaching
@EnableAsync
public class SevenElevenApplication {
    public static void main(String[] args) {
        // Load .env file manually at bootstrap to support local execution from IDE
        try {
            java.nio.file.Path path = java.nio.file.Paths.get(".env");
            if (!java.nio.file.Files.exists(path)) {
                path = java.nio.file.Paths.get("../.env");
            }
            if (java.nio.file.Files.exists(path)) {
                java.nio.file.Files.readAllLines(path).forEach(line -> {
                    String trimmed = line.trim();
                    if (!trimmed.isEmpty() && !trimmed.startsWith("#") && trimmed.contains("=")) {
                        int index = trimmed.indexOf("=");
                        String key = trimmed.substring(0, index).trim();
                        String value = trimmed.substring(index + 1).trim();
                        
                        // Strip optional quotes around env values
                        if (value.startsWith("\"") && value.endsWith("\"") && value.length() > 1) {
                            value = value.substring(1, value.length() - 1);
                        } else if (value.startsWith("'") && value.endsWith("'") && value.length() > 1) {
                            value = value.substring(1, value.length() - 1);
                        }
                        
                        System.setProperty(key, value);
                    }
                });
            }
        } catch (Exception e) {
            // Ignore loading failures to fallback to standard properties
        }
        
        SpringApplication.run(SevenElevenApplication.class, args);
    }
}
