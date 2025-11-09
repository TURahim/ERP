package com.invoiceme.erp.dto;

import lombok.Data;

@Data
public class ErrorEnvelope {
    private Error error;

    @Data
    public static class Error {
        private String code;
        private String message;
        private Object details;
    }
}

