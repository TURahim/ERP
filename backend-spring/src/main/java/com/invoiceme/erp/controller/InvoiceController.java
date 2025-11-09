package com.invoiceme.erp.controller;

import com.invoiceme.erp.dto.ApiResponse;
import com.invoiceme.erp.dto.CreateInvoiceRequest;
import com.invoiceme.erp.dto.UpdateInvoiceRequest;
import com.invoiceme.erp.model.Invoice;
import com.invoiceme.erp.model.Invoice.InvoiceStatus;
import com.invoiceme.erp.model.Payment;
import com.invoiceme.erp.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {
    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<ApiResponse<Invoice>> listInvoices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) InvoiceStatus status,
            @RequestParam(required = false) String customerId) {
        Page<Invoice> invoicePage = invoiceService.listInvoices(page, size, status, customerId);
        
        ApiResponse<Invoice> response = new ApiResponse<>();
        response.setData(invoicePage.getContent());
        
        ApiResponse.Pagination pagination = new ApiResponse.Pagination();
        pagination.setPage(invoicePage.getNumber());
        pagination.setSize(invoicePage.getSize());
        pagination.setTotal(invoicePage.getTotalElements());
        pagination.setTotalPages(invoicePage.getTotalPages());
        response.setPagination(pagination);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getInvoice(@PathVariable String id) {
        Invoice invoice = invoiceService.getInvoice(id);
        return ResponseEntity.ok(invoice);
    }

    @PostMapping
    public ResponseEntity<Invoice> createInvoice(@Valid @RequestBody CreateInvoiceRequest request) {
        Invoice invoice = invoiceService.createInvoice(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(invoice);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Invoice> updateInvoice(
            @PathVariable String id,
            @Valid @RequestBody UpdateInvoiceRequest request) {
        Invoice invoice = invoiceService.updateInvoice(id, request);
        return ResponseEntity.ok(invoice);
    }

    @PostMapping("/{id}/send")
    public ResponseEntity<Invoice> sendInvoice(@PathVariable String id) {
        Invoice invoice = invoiceService.sendInvoice(id);
        return ResponseEntity.ok(invoice);
    }

    @GetMapping("/{id}/payments")
    public ResponseEntity<List<Payment>> getInvoicePayments(@PathVariable String id) {
        List<Payment> payments = invoiceService.getInvoicePayments(id);
        return ResponseEntity.ok(payments);
    }
}

