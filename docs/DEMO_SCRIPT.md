# Demo Script for InvoiceMe ERP

**Duration:** ~7 minutes  
**Audience:** Stakeholders, investors, potential customers

## Pre-Demo Setup

1. Ensure backend is running on `http://localhost:8080`
2. Ensure frontend is running on `http://localhost:3000`
3. Set `NEXT_PUBLIC_USE_MOCK_API=false` in `.env.local`
4. Clear browser cache if needed
5. Have demo data ready (or use fresh install)

## Demo Flow

### 1. Introduction (30 seconds)
- "Today I'll show you InvoiceMe ERP, a modern invoice management system"
- "We'll walk through the complete workflow: creating customers, generating invoices, and recording payments"

### 2. Customer Management (1 minute)

**Show Customer List:**
- Navigate to Customers page
- "Here's our customer list with active and inactive customers"
- Show pagination if applicable
- "Let me create a new customer for our demo"

**Create Customer:**
- Click "Create Customer"
- Fill form:
  - Name: "Demo Corp"
  - Email: "billing@democorp.com"
  - Address: "123 Business St, San Francisco, CA 94105"
- Click "Create Customer"
- "Customer created successfully, and we're redirected to the detail page"
- Show customer details

### 3. Invoice Creation (2 minutes)

**Navigate to Invoices:**
- Click "Invoices" in navigation
- "Here's our invoice list showing different statuses: DRAFT, SENT, and PAID"

**Create Invoice:**
- Click "Create Invoice"
- "I'll create an invoice for Demo Corp"
- Select "Demo Corp" from customer dropdown
- Add first line item:
  - Description: "Web Development Services"
  - Quantity: 10
  - Unit Price: $150
  - "Notice the amount calculates automatically: $1,500"
- Click "Add Line Item"
- Add second line item:
  - Description: "Consulting Services"
  - Quantity: 5
  - Unit Price: $200
  - "Another $1,000, total is now $2,500"
- "Let me apply a discount"
- Enter Discount: $100
- "The total updates automatically: $2,400"
- Set Due Date: 30 days from today
- Add Notes: "Payment terms: Net 30"
- Click "Create Invoice"
- "Invoice created with number INV-2025-0001"
- "Status is DRAFT, meaning we can still edit it"

### 4. Invoice Management (1 minute)

**View Invoice:**
- Show invoice detail page
- "Here's the complete invoice with all line items, totals, and customer information"
- "Balance is $2,400 since no payments have been recorded yet"

**Edit Invoice (if needed):**
- "Since it's DRAFT, we can still edit it"
- Click "Edit Invoice"
- Modify a line item
- Save changes
- "Changes saved successfully"

**Send Invoice:**
- Click "Send Invoice"
- "A confirmation dialog appears"
- Click "Confirm"
- "Invoice status changed to SENT"
- "Issued date is set to today"
- "Notice the Edit button is now disabled - we can't edit sent invoices"

### 5. Payment Recording (2 minutes)

**Record Partial Payment:**
- "Now let's record a partial payment"
- Click "Record Payment"
- "The form is pre-filled with the invoice ID"
- Enter Amount: $1,000
- Select Payment Method: "Wire Transfer"
- Add Notes: "Payment received via bank transfer"
- Click "Record Payment"
- "Payment recorded successfully"
- "Notice the balance updated to $1,400"
- "Status is still SENT because there's still a balance"

**View Payments:**
- Scroll to payments section
- "Here's the payment we just recorded"
- Show payment details

**Record Final Payment:**
- Click "Record Payment" again
- Enter Amount: $1,400
- Select Payment Method: "Check"
- Add Notes: "Final payment"
- Click "Record Payment"
- "Payment recorded"
- "Balance is now $0"
- "Status automatically changed to PAID"
- "The system detected the invoice is fully paid"

### 6. Edge Cases & Validation (1 minute)

**Show Overpayment Protection:**
- "Let me show you our validation"
- Create a new invoice (quick)
- Send it
- Try to record payment exceeding balance
- "The system prevents overpayment and shows an error"

**Show Status Protection:**
- "We also protect against invalid operations"
- Try to edit a SENT invoice
- "The system prevents editing sent invoices"

### 7. Summary & Closing (30 seconds)

- "To summarize, InvoiceMe ERP provides:"
  - Complete customer management
  - Professional invoice generation
  - Automatic calculations
  - Payment tracking
  - Status management
  - Validation and error handling
- "All data is stored securely and calculations are always accurate"
- "Thank you for watching!"

## Key Points to Emphasize

1. **Automatic Calculations:** Totals, balances, and amounts calculate automatically
2. **Status Management:** Clear workflow from DRAFT → SENT → PAID
3. **Validation:** System prevents errors (overpayment, editing sent invoices)
4. **User Experience:** Clean, professional interface
5. **Real-time Updates:** Balance and status update immediately after payments

## Troubleshooting Tips

- If backend is down, switch to mock API mode
- If errors occur, check browser console
- Have backup demo data ready
- Practice the flow before the actual demo

