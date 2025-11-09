package com.invoiceme.erp.repository;

import com.invoiceme.erp.model.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, String> {
    Page<Customer> findByIsActiveTrue(Pageable pageable);
    Page<Customer> findAll(Pageable pageable);
    Optional<Customer> findByEmail(String email);
    boolean existsByEmail(String email);
}

