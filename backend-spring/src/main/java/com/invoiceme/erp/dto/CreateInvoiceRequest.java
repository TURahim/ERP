package com.invoiceme.erp.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class CreateInvoiceRequest {
    @NotBlank(message = "Customer ID is required")
    private String customerId;

    @NotEmpty(message = "Line items are required")
    @Valid
    private List<LineItemRequest> lineItems;

    @NotNull(message = "Due date is required")
    private LocalDate dueDate;

    private BigDecimal discount = BigDecimal.ZERO;

    private String notes;

    @Data
    public static class LineItemRequest {
        @NotBlank(message = "Description is required")
        private String description;

        @NotNull(message = "Quantity is required")
        private Integer quantity;

        @NotNull(message = "Unit price is required")
        private BigDecimal unitPrice;
    }
}

