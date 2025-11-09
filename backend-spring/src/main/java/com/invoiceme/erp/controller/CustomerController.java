package com.invoiceme.erp.controller;

import com.invoiceme.erp.dto.ApiResponse;
import com.invoiceme.erp.dto.CreateCustomerRequest;
import com.invoiceme.erp.dto.UpdateCustomerRequest;
import com.invoiceme.erp.model.Customer;
import com.invoiceme.erp.service.CustomerService;
import com.invoiceme.erp.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {
    private final CustomerService customerService;
    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<ApiResponse<Customer>> listCustomers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Boolean includeInactive) {
        Page<Customer> customerPage = customerService.listCustomers(page, size, includeInactive);
        
        ApiResponse<Customer> response = new ApiResponse<>();
        response.setData(customerPage.getContent());
        
        ApiResponse.Pagination pagination = new ApiResponse.Pagination();
        pagination.setPage(customerPage.getNumber());
        pagination.setSize(customerPage.getSize());
        pagination.setTotal(customerPage.getTotalElements());
        pagination.setTotalPages(customerPage.getTotalPages());
        response.setPagination(pagination);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomer(@PathVariable String id) {
        Customer customer = customerService.getCustomer(id);
        return ResponseEntity.ok(customer);
    }

    @PostMapping
    public ResponseEntity<Customer> createCustomer(@Valid @RequestBody CreateCustomerRequest request) {
        Customer customer = customerService.createCustomer(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(customer);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Customer> updateCustomer(
            @PathVariable String id,
            @Valid @RequestBody UpdateCustomerRequest request) {
        Customer customer = customerService.updateCustomer(id, request);
        return ResponseEntity.ok(customer);
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<Customer> deactivateCustomer(@PathVariable String id) {
        // Check for unpaid invoices
        var unpaidInvoices = invoiceService.listInvoices(0, 1, null, id);
        if (unpaidInvoices.getTotalElements() > 0) {
            // Check if any are not paid
            boolean hasUnpaid = unpaidInvoices.getContent().stream()
                    .anyMatch(inv -> inv.getStatus() != com.invoiceme.erp.model.Invoice.InvoiceStatus.PAID 
                            && inv.getBalance().compareTo(java.math.BigDecimal.ZERO) > 0);
            if (hasUnpaid) {
                throw new com.invoiceme.erp.exception.ApiException(
                        "UNPAID_INVOICES", 
                        "Cannot deactivate customer with unpaid invoices");
            }
        }
        
        Customer customer = customerService.deactivateCustomer(id);
        return ResponseEntity.ok(customer);
    }
}

