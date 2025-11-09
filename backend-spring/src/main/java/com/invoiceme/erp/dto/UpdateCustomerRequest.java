package com.invoiceme.erp.dto;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class UpdateCustomerRequest {
    private String name;
    
    @Email(message = "Email must be valid")
    private String email;
    
    private String billingAddress;
}

