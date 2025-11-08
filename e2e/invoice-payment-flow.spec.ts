import { test, expect } from '@playwright/test';

test.describe('Invoice Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page and login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard');
  });

  test('complete invoice payment flow', async ({ page }) => {
    // 1. Create customer
    await page.click('text=Customers');
    await page.waitForURL('/customers');
    await page.click('text=Create Customer');
    await page.waitForURL('/customers/new');
    
    await page.fill('input[name="name"]', 'Test Corp');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('textarea[name="billingAddress"]', '123 Test St');
    await page.click('button[type="submit"]');
    
    // Wait for customer to be created and navigate to customer detail
    await page.waitForURL(/\/customers\/[^/]+$/);
    await expect(page.locator('text=Test Corp')).toBeVisible();
    
    // Get customer ID from URL
    const customerUrl = page.url();
    const customerId = customerUrl.split('/').pop();
    
    // 2. Create invoice
    await page.click('text=Invoices');
    await page.waitForURL('/invoices');
    await page.click('text=Create Invoice');
    await page.waitForURL('/invoices/new');
    
    // Select customer
    await page.selectOption('select[name="customerId"]', { label: 'Test Corp' });
    
    // Add line item
    await page.fill('input[name="lineItems.0.description"]', 'Service A');
    await page.fill('input[name="lineItems.0.quantity"]', '1');
    await page.fill('input[name="lineItems.0.unitPrice"]', '1000');
    
    // Set due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    const dueDateStr = dueDate.toISOString().split('T')[0];
    await page.fill('input[name="dueDate"]', dueDateStr);
    
    await page.click('button[type="submit"]');
    
    // Wait for invoice to be created
    await page.waitForURL(/\/invoices\/[^/]+$/);
    await expect(page.locator('text=DRAFT')).toBeVisible();
    await expect(page.locator('text=\\$1,000')).toBeVisible();
    
    // Get invoice ID from URL
    const invoiceUrl = page.url();
    const invoiceId = invoiceUrl.split('/').pop();
    
    // 3. Mark invoice as sent
    await page.click('text=Send Invoice');
    await page.click('button:has-text("Confirm")');
    
    // Wait for status to change
    await expect(page.locator('text=SENT')).toBeVisible({ timeout: 5000 });
    
    // 4. Record payment
    await page.click('text=Record Payment');
    await page.waitForURL(`/invoices/${invoiceId}/payments/new`);
    
    await page.fill('input[name="amount"]', '1000');
    await page.selectOption('select[name="paymentMethod"]', 'Wire');
    await page.click('button[type="submit"]');
    
    // Wait for payment to be recorded and navigate back to invoice
    await page.waitForURL(`/invoices/${invoiceId}`);
    
    // 5. Verify invoice paid
    await expect(page.locator('text=PAID')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Balance.*\\$0')).toBeVisible();
  });

  test('should reject overpayment', async ({ page }) => {
    // Create customer
    await page.click('text=Customers');
    await page.waitForURL('/customers');
    await page.click('text=Create Customer');
    await page.waitForURL('/customers/new');
    
    await page.fill('input[name="name"]', 'Overpayment Test Corp');
    await page.fill('input[name="email"]', 'overpayment@test.com');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/customers\/[^/]+$/);
    
    // Create invoice
    await page.click('text=Invoices');
    await page.waitForURL('/invoices');
    await page.click('text=Create Invoice');
    await page.waitForURL('/invoices/new');
    
    await page.selectOption('select[name="customerId"]', { label: 'Overpayment Test Corp' });
    await page.fill('input[name="lineItems.0.description"]', 'Service');
    await page.fill('input[name="lineItems.0.quantity"]', '1');
    await page.fill('input[name="lineItems.0.unitPrice"]', '1000');
    
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    const dueDateStr = dueDate.toISOString().split('T')[0];
    await page.fill('input[name="dueDate"]', dueDateStr);
    
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/invoices\/[^/]+$/);
    
    const invoiceUrl = page.url();
    const invoiceId = invoiceUrl.split('/').pop();
    
    // Send invoice
    await page.click('text=Send Invoice');
    await page.click('button:has-text("Confirm")');
    await expect(page.locator('text=SENT')).toBeVisible({ timeout: 5000 });
    
    // Try to record overpayment
    await page.click('text=Record Payment');
    await page.waitForURL(`/invoices/${invoiceId}/payments/new`);
    
    await page.fill('input[name="amount"]', '1500'); // More than invoice total
    await page.selectOption('select[name="paymentMethod"]', 'Wire');
    await page.click('button[type="submit"]');
    
    // Verify error message
    await expect(page.locator('text=exceeds invoice balance')).toBeVisible({ timeout: 5000 });
  });
});

