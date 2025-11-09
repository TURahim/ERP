package com.invoiceme.erp.config;

import com.invoiceme.erp.dto.ErrorEnvelope;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Order(1)
@RequiredArgsConstructor
public class ApiKeyFilter implements Filter {
    
    private static final String API_KEY_HEADER = "X-API-Key";
    private final ObjectMapper objectMapper;
    
    @Value("${api.key:demo-api-key-12345}")
    private String validApiKey;

    @Override
    public void doFilter(jakarta.servlet.ServletRequest request, jakarta.servlet.ServletResponse response, 
                        FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // Skip filter for actuator endpoints
        String path = httpRequest.getRequestURI();
        if (path.startsWith("/actuator")) {
            chain.doFilter(request, response);
            return;
        }

        String apiKey = httpRequest.getHeader(API_KEY_HEADER);

        if (apiKey == null || !apiKey.equals(validApiKey)) {
            httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            httpResponse.setContentType("application/json");

            ErrorEnvelope.Error error = new ErrorEnvelope.Error();
            error.setCode("UNAUTHORIZED");
            error.setMessage("Invalid API Key");

            ErrorEnvelope envelope = new ErrorEnvelope();
            envelope.setError(error);

            objectMapper.writeValue(httpResponse.getWriter(), envelope);
            return;
        }

        chain.doFilter(request, response);
    }
}

