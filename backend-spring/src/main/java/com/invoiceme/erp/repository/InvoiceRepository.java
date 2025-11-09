package com.invoiceme.erp.repository;

import com.invoiceme.erp.model.Invoice;
import com.invoiceme.erp.model.Invoice.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, String> {
    Page<Invoice> findByStatus(InvoiceStatus status, Pageable pageable);
    Page<Invoice> findByCustomerId(String customerId, Pageable pageable);
    Page<Invoice> findByCustomerIdAndStatus(String customerId, InvoiceStatus status, Pageable pageable);
    List<Invoice> findByCustomerIdAndStatusNot(String customerId, InvoiceStatus status);
}

