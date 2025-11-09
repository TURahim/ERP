package com.invoiceme.erp.service;

import com.invoiceme.erp.dto.CreatePaymentRequest;
import com.invoiceme.erp.exception.ApiException;
import com.invoiceme.erp.model.Invoice;
import com.invoiceme.erp.model.Invoice.InvoiceStatus;
import com.invoiceme.erp.model.Payment;
import com.invoiceme.erp.repository.InvoiceRepository;
import com.invoiceme.erp.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceService invoiceService;

    @Transactional
    public Payment createPayment(CreatePaymentRequest request) {
        Invoice invoice = invoiceService.getInvoice(request.getInvoiceId());

        if (request.getAmount().compareTo(invoice.getBalance()) > 0) {
            throw new ApiException("OVERPAYMENT", "Payment amount exceeds outstanding balance");
        }

        Payment payment = new Payment();
        payment.setInvoice(invoice);
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setNotes(request.getNotes());

        Payment savedPayment = paymentRepository.save(payment);

        // Update invoice balance and status
        BigDecimal newBalance = invoice.getBalance().subtract(request.getAmount());
        invoice.setBalance(newBalance);
        
        if (newBalance.compareTo(BigDecimal.ZERO) <= 0) {
            invoice.setStatus(InvoiceStatus.PAID);
        }

        invoiceRepository.save(invoice);

        return savedPayment;
    }

    public Payment getPayment(String id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Payment " + id + " not found"));
    }
}

