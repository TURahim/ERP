package com.invoiceme.erp.exception;

import com.invoiceme.erp.dto.ErrorEnvelope;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorEnvelope> handleApiException(ApiException ex) {
        ErrorEnvelope.Error error = new ErrorEnvelope.Error();
        error.setCode(ex.getCode());
        error.setMessage(ex.getMessage());

        ErrorEnvelope envelope = new ErrorEnvelope();
        envelope.setError(error);

        HttpStatus status = switch (ex.getCode()) {
            case "NOT_FOUND" -> HttpStatus.NOT_FOUND;
            case "UNAUTHORIZED" -> HttpStatus.UNAUTHORIZED;
            case "DUPLICATE_EMAIL", "UNPAID_INVOICES", "INVALID_STATUS", "OVERPAYMENT" -> HttpStatus.BAD_REQUEST;
            default -> HttpStatus.INTERNAL_SERVER_ERROR;
        };

        return ResponseEntity.status(status).body(envelope);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorEnvelope> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> details = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            details.put(fieldName, errorMessage);
        });

        ErrorEnvelope.Error error = new ErrorEnvelope.Error();
        error.setCode("VALIDATION_ERROR");
        error.setMessage("Validation failed");
        error.setDetails(details);

        ErrorEnvelope envelope = new ErrorEnvelope();
        envelope.setError(error);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(envelope);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorEnvelope> handleGenericException(Exception ex) {
        ErrorEnvelope.Error error = new ErrorEnvelope.Error();
        error.setCode("INTERNAL_ERROR");
        error.setMessage("An unexpected error occurred");

        ErrorEnvelope envelope = new ErrorEnvelope();
        envelope.setError(error);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(envelope);
    }
}

