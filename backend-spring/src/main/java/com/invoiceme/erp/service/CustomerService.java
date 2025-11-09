package com.invoiceme.erp.service;

import com.invoiceme.erp.dto.CreateCustomerRequest;
import com.invoiceme.erp.dto.UpdateCustomerRequest;
import com.invoiceme.erp.exception.ApiException;
import com.invoiceme.erp.model.Customer;
import com.invoiceme.erp.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomerService {
    private final CustomerRepository customerRepository;

    public Page<Customer> listCustomers(int page, int size, Boolean includeInactive) {
        Pageable pageable = PageRequest.of(page, size);
        if (includeInactive != null && includeInactive) {
            return customerRepository.findAll(pageable);
        }
        return customerRepository.findByIsActiveTrue(pageable);
    }

    public Customer getCustomer(String id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Customer " + id + " not found"));
    }

    @Transactional
    public Customer createCustomer(CreateCustomerRequest request) {
        if (customerRepository.existsByEmail(request.getEmail())) {
            throw new ApiException("DUPLICATE_EMAIL", "Email " + request.getEmail() + " already exists");
        }

        Customer customer = new Customer();
        customer.setName(request.getName());
        customer.setEmail(request.getEmail());
        customer.setBillingAddress(request.getBillingAddress());
        customer.setIsActive(true);

        return customerRepository.save(customer);
    }

    @Transactional
    public Customer updateCustomer(String id, UpdateCustomerRequest request) {
        Customer customer = getCustomer(id);

        if (request.getName() != null) {
            customer.setName(request.getName());
        }
        if (request.getEmail() != null && !request.getEmail().equals(customer.getEmail())) {
            if (customerRepository.existsByEmail(request.getEmail())) {
                throw new ApiException("DUPLICATE_EMAIL", "Email " + request.getEmail() + " already exists");
            }
            customer.setEmail(request.getEmail());
        }
        if (request.getBillingAddress() != null) {
            customer.setBillingAddress(request.getBillingAddress());
        }

        return customerRepository.save(customer);
    }

    @Transactional
    public Customer deactivateCustomer(String id) {
        Customer customer = getCustomer(id);
        
        // Check for unpaid invoices will be done in controller
        // where we have access to InvoiceService
        
        customer.setIsActive(false);
        return customerRepository.save(customer);
    }
}

