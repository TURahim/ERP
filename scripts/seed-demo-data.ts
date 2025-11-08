#!/usr/bin/env node

/**
 * Demo Data Seeder Script
 * 
 * This script creates realistic demo data for InvoiceMe ERP.
 * It works with the real backend API.
 * 
 * Usage:
 *   npm run seed:demo
 *   or
 *   tsx scripts/seed-demo-data.ts
 * 
 * Environment Variables:
 *   NEXT_PUBLIC_API_BASE_URL - Backend API URL (default: http://localhost:8080)
 *   NEXT_PUBLIC_API_KEY - API Key (default: demo-api-key-12345)
 */

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'demo-api-key-12345';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  },
});

// Demo customer data
const customers = [
  {
    name: 'Acme Corporation',
    email: 'billing@acme.com',
    billingAddress: '123 Business Park Dr, San Francisco, CA 94105',
  },
  {
    name: 'TechStart Inc',
    email: 'accounts@techstart.io',
    billingAddress: '456 Innovation Way, Austin, TX 78701',
  },
  {
    name: 'Global Solutions Ltd',
    email: 'finance@globalsolutions.com',
    billingAddress: '789 Enterprise Blvd, New York, NY 10001',
  },
  {
    name: 'Creative Agency',
    email: 'billing@creativeagency.com',
    billingAddress: '321 Design Street, Los Angeles, CA 90028',
  },
  {
    name: 'Manufacturing Co',
    email: 'accounts@manufacturing.com',
    billingAddress: '555 Industrial Ave, Chicago, IL 60601',
  },
  {
    name: 'Retail Store Chain',
    email: 'payments@retailchain.com',
    billingAddress: '888 Commerce Center, Seattle, WA 98101',
  },
  {
    name: 'Consulting Group',
    email: 'billing@consultinggroup.com',
    billingAddress: '222 Professional Plaza, Boston, MA 02101',
  },
  {
    name: 'Healthcare Systems',
    email: 'accounts@healthcare.com',
    billingAddress: '777 Medical Center Dr, Philadelphia, PA 19101',
  },
];

// Demo invoice line items templates
const lineItemTemplates = [
  [
    { description: 'Web Development Services', quantity: 40, unitPrice: 150 },
    { description: 'UI/UX Design', quantity: 20, unitPrice: 125 },
  ],
  [
    { description: 'Cloud Infrastructure Setup', quantity: 1, unitPrice: 5000 },
    { description: 'Monthly Maintenance', quantity: 3, unitPrice: 800 },
  ],
  [
    { description: 'Consulting Services', quantity: 50, unitPrice: 200 },
    { description: 'Project Management', quantity: 30, unitPrice: 150 },
  ],
  [
    { description: 'Brand Identity Design', quantity: 1, unitPrice: 3500 },
    { description: 'Marketing Materials', quantity: 10, unitPrice: 250 },
  ],
  [
    { description: 'Equipment Installation', quantity: 5, unitPrice: 1200 },
    { description: 'Training Sessions', quantity: 8, unitPrice: 500 },
  ],
  [
    { description: 'Inventory Management System', quantity: 1, unitPrice: 8000 },
    { description: 'Data Migration', quantity: 1, unitPrice: 3000 },
  ],
  [
    { description: 'Strategic Planning', quantity: 1, unitPrice: 10000 },
    { description: 'Market Research', quantity: 1, unitPrice: 5000 },
  ],
  [
    { description: 'Electronic Health Records Setup', quantity: 1, unitPrice: 15000 },
    { description: 'Staff Training', quantity: 20, unitPrice: 300 },
  ],
];

// Helper function to create a customer
async function createCustomer(customerData: typeof customers[0]) {
  try {
    const response = await apiClient.post('/api/customers', customerData);
    return response.data.id;
  } catch (error: any) {
    console.error(`Failed to create customer ${customerData.name}:`, error.response?.data || error.message);
    throw error;
  }
}

// Helper function to create an invoice
async function createInvoice(customerId: string, lineItems: any[], discount: number = 0, dueDate?: string) {
  const invoiceData = {
    customerId,
    lineItems,
    discount,
    dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Payment terms: Net 30',
  };

  try {
    const response = await apiClient.post('/api/invoices', invoiceData);
    return response.data;
  } catch (error: any) {
    console.error('Failed to create invoice:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function to send an invoice
async function sendInvoice(invoiceId: string) {
  try {
    const response = await apiClient.post(`/api/invoices/${invoiceId}/send`);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to send invoice ${invoiceId}:`, error.response?.data || error.message);
    throw error;
  }
}

// Helper function to record a payment
async function recordPayment(invoiceId: string, amount: number, paymentMethod: string, notes?: string) {
  const paymentData = {
    invoiceId,
    amount,
    paymentMethod,
    notes,
  };

  try {
    const response = await apiClient.post('/api/payments', paymentData);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to record payment for invoice ${invoiceId}:`, error.response?.data || error.message);
    throw error;
  }
}

// Main seeding function
async function seedDemoData() {
  console.log('🌱 Starting demo data seeding...\n');
  console.log(`API URL: ${API_BASE_URL}\n`);

  const customerIds: string[] = [];
  const invoices: Array<{ id: string; total: number; status: string }> = [];

  // Step 1: Create customers
  console.log('📝 Creating customers...');
  for (const customer of customers) {
    try {
      const customerId = await createCustomer(customer);
      customerIds.push(customerId);
      console.log(`  ✅ Created customer: ${customer.name}`);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.log(`  ❌ Skipped customer: ${customer.name}`);
    }
  }
  console.log(`\n✅ Created ${customerIds.length} customers\n`);

  // Step 2: Create invoices
  console.log('📄 Creating invoices...');
  for (let i = 0; i < customerIds.length; i++) {
    const customerId = customerIds[i];
    const lineItems = lineItemTemplates[i % lineItemTemplates.length];
    
    // Create 2-3 invoices per customer with different statuses
    const numInvoices = Math.floor(Math.random() * 2) + 2; // 2 or 3 invoices
    
    for (let j = 0; j < numInvoices; j++) {
      try {
        const discount = j === 0 ? Math.floor(Math.random() * 200) : 0; // First invoice has discount
        const invoice = await createInvoice(customerId, lineItems, discount);
        invoices.push({ id: invoice.id, total: invoice.total, status: invoice.status });
        console.log(`  ✅ Created invoice: ${invoice.invoiceNumber} (${invoice.status}) - $${invoice.total.toFixed(2)}`);
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.log(`  ❌ Failed to create invoice for customer ${i + 1}`);
      }
    }
  }
  console.log(`\n✅ Created ${invoices.length} invoices\n`);

  // Step 3: Send some invoices (make them SENT status)
  console.log('📤 Sending invoices...');
  const invoicesToSend = invoices.filter((_, index) => index % 2 === 0); // Send every other invoice
  let sentCount = 0;
  for (const invoice of invoicesToSend) {
    if (invoice.status === 'DRAFT') {
      try {
        await sendInvoice(invoice.id);
        invoice.status = 'SENT';
        sentCount++;
        console.log(`  ✅ Sent invoice: ${invoice.id}`);
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.log(`  ❌ Failed to send invoice: ${invoice.id}`);
      }
    }
  }
  console.log(`\n✅ Sent ${sentCount} invoices\n`);

  // Step 4: Record payments for SENT invoices
  console.log('💰 Recording payments...');
  const sentInvoices = invoices.filter(inv => inv.status === 'SENT');
  let paymentCount = 0;

  for (const invoice of sentInvoices) {
    try {
      // Get current invoice to check balance
      const invoiceResponse = await apiClient.get(`/api/invoices/${invoice.id}`);
      const currentInvoice = invoiceResponse.data;
      const balance = currentInvoice.balance || currentInvoice.total;

      if (balance > 0) {
        // Record partial or full payment
        const paymentAmount = Math.random() > 0.5 
          ? balance // Full payment
          : Math.floor(balance * 0.6); // Partial payment (60%)

        const paymentMethods = ['Wire', 'Card', 'Check', 'ACH'];
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

        await recordPayment(
          invoice.id,
          paymentAmount,
          paymentMethod,
          `Payment via ${paymentMethod}`
        );

        paymentCount++;
        console.log(`  ✅ Recorded payment: $${paymentAmount.toFixed(2)} for invoice ${invoice.id}`);

        // If full payment, check if status changed to PAID
        if (paymentAmount >= balance) {
          const updatedInvoice = await apiClient.get(`/api/invoices/${invoice.id}`);
          if (updatedInvoice.data.status === 'PAID') {
            invoice.status = 'PAID';
          }
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.log(`  ❌ Failed to record payment for invoice: ${invoice.id}`);
    }
  }
  console.log(`\n✅ Recorded ${paymentCount} payments\n`);

  // Summary
  console.log('📊 Demo Data Summary:');
  console.log(`  • Customers: ${customerIds.length}`);
  console.log(`  • Invoices: ${invoices.length}`);
  console.log(`    - DRAFT: ${invoices.filter(i => i.status === 'DRAFT').length}`);
  console.log(`    - SENT: ${invoices.filter(i => i.status === 'SENT').length}`);
  console.log(`    - PAID: ${invoices.filter(i => i.status === 'PAID').length}`);
  console.log(`  • Payments: ${paymentCount}`);
  console.log('\n🎉 Demo data seeding complete!\n');
}

// Run the seeding
seedDemoData().catch(error => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
