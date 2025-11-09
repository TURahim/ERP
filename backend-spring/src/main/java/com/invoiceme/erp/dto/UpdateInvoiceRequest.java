package com.invoiceme.erp.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class UpdateInvoiceRequest {
    @NotEmpty(message = "Line items are required")
    @Valid
    private List<CreateInvoiceRequest.LineItemRequest> lineItems;

    private LocalDate dueDate;
}

