package com.invoiceme.erp.service;

import com.invoiceme.erp.dto.CreateInvoiceRequest;
import com.invoiceme.erp.dto.UpdateInvoiceRequest;
import com.invoiceme.erp.exception.ApiException;
import com.invoiceme.erp.model.Invoice;
import com.invoiceme.erp.model.Invoice.InvoiceStatus;
import com.invoiceme.erp.model.LineItem;
import com.invoiceme.erp.repository.InvoiceRepository;
import com.invoiceme.erp.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InvoiceService {
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final CustomerService customerService;

    public Page<Invoice> listInvoices(int page, int size, InvoiceStatus status, String customerId) {
        Pageable pageable = PageRequest.of(page, size);
        
        if (customerId != null && status != null) {
            return invoiceRepository.findByCustomerIdAndStatus(customerId, status, pageable);
        } else if (customerId != null) {
            return invoiceRepository.findByCustomerId(customerId, pageable);
        } else if (status != null) {
            return invoiceRepository.findByStatus(status, pageable);
        }
        
        return invoiceRepository.findAll(pageable);
    }

    public Invoice getInvoice(String id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Invoice " + id + " not found"));
    }

    @Transactional
    public Invoice createInvoice(CreateInvoiceRequest request) {
        // Verify customer exists
        customerService.getCustomer(request.getCustomerId());

        Invoice invoice = new Invoice();
        invoice.setCustomer(customerService.getCustomer(request.getCustomerId()));
        invoice.setStatus(InvoiceStatus.DRAFT);
        invoice.setDueDate(request.getDueDate());
        invoice.setDiscount(request.getDiscount() != null ? request.getDiscount() : BigDecimal.ZERO);
        invoice.setNotes(request.getNotes());

        // Generate invoice number
        long count = invoiceRepository.count();
        invoice.setInvoiceNumber(String.format("INV-2025-%04d", count + 1));

        // Create line items
        List<LineItem> lineItems = request.getLineItems().stream()
                .map(item -> {
                    LineItem lineItem = new LineItem();
                    lineItem.setDescription(item.getDescription());
                    lineItem.setQuantity(item.getQuantity());
                    lineItem.setUnitPrice(item.getUnitPrice());
                    lineItem.setAmount(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
                    lineItem.setInvoice(invoice);
                    return lineItem;
                })
                .toList();

        invoice.setLineItems(lineItems);
        invoice.calculateTotals();
        invoice.setBalance(invoice.getTotal());

        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice updateInvoice(String id, UpdateInvoiceRequest request) {
        Invoice invoice = getInvoice(id);

        if (invoice.getStatus() != InvoiceStatus.DRAFT) {
            throw new ApiException("INVALID_STATUS", "Can only edit invoices in DRAFT status");
        }

        if (request.getLineItems() != null) {
            invoice.getLineItems().clear();
            List<LineItem> lineItems = request.getLineItems().stream()
                    .map(item -> {
                        LineItem lineItem = new LineItem();
                        lineItem.setDescription(item.getDescription());
                        lineItem.setQuantity(item.getQuantity());
                        lineItem.setUnitPrice(item.getUnitPrice());
                        lineItem.setAmount(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
                        lineItem.setInvoice(invoice);
                        return lineItem;
                    })
                    .toList();
            invoice.setLineItems(lineItems);
        }

        if (request.getDueDate() != null) {
            invoice.setDueDate(request.getDueDate());
        }

        invoice.calculateTotals();
        invoice.setBalance(invoice.getTotal());

        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice sendInvoice(String id) {
        Invoice invoice = getInvoice(id);
        invoice.setStatus(InvoiceStatus.SENT);
        return invoiceRepository.save(invoice);
    }

    public List<com.invoiceme.erp.model.Payment> getInvoicePayments(String id) {
        getInvoice(id); // Verify invoice exists
        return paymentRepository.findByInvoiceId(id);
    }
}

