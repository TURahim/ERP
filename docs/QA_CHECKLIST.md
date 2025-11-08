# Manual QA Checklist

## Customer Management (US-CUST-001 to US-CUST-005)

### Customer List
- [ ] Customer list displays correctly
- [ ] Pagination works (if > 20 customers)
- [ ] Active/Inactive filter works
- [ ] Search functionality works (if implemented)
- [ ] Create Customer button navigates to form

### Create Customer
- [ ] Form validates required fields (name)
- [ ] Email validation works
- [ ] Form submits successfully
- [ ] Success toast appears
- [ ] Redirects to customer detail page
- [ ] Customer appears in list

### View Customer
- [ ] Customer details display correctly
- [ ] All fields shown (name, email, address, status)
- [ ] Created/Updated timestamps shown
- [ ] Edit button works
- [ ] Deactivate button works

### Edit Customer
- [ ] Form pre-populates with existing data
- [ ] Updates save successfully
- [ ] Success toast appears
- [ ] Redirects to customer detail
- [ ] Changes reflected in list

### Deactivate Customer
- [ ] Deactivate button works
- [ ] Confirmation dialog appears
- [ ] Customer status changes to inactive
- [ ] Customer hidden from default list (if includeInactive=false)
- [ ] Customer visible when includeInactive=true

## Invoice Management (US-INV-001 to US-INV-006)

### Invoice List
- [ ] Invoice list displays correctly
- [ ] Status badges show correct colors (DRAFT/SENT/PAID)
- [ ] Invoice numbers display correctly
- [ ] Customer names display correctly
- [ ] Totals and balances display correctly
- [ ] Pagination works
- [ ] Status filter works
- [ ] Customer filter works
- [ ] Create Invoice button works

### Create Invoice
- [ ] Customer dropdown populated
- [ ] Can add multiple line items
- [ ] Can remove line items
- [ ] Line item amounts calculate correctly
- [ ] Subtotal calculates correctly
- [ ] Discount applies correctly
- [ ] Total calculates correctly (subtotal - discount)
- [ ] Due date picker works
- [ ] Form validates required fields
- [ ] Form submits successfully
- [ ] Invoice number generated (INV-YYYY-NNNN format)
- [ ] Status defaults to DRAFT
- [ ] Redirects to invoice detail

### View Invoice
- [ ] Invoice details display correctly
- [ ] All line items shown
- [ ] Totals and balance shown
- [ ] Status badge correct
- [ ] Customer link works
- [ ] Edit button works (if DRAFT)
- [ ] Send Invoice button works (if DRAFT)
- [ ] Record Payment button works (if SENT)
- [ ] Payments list shown (if any)

### Edit Invoice
- [ ] Form pre-populates with existing data
- [ ] Can modify line items
- [ ] Can modify discount
- [ ] Can modify due date
- [ ] Updates save successfully
- [ ] Cannot edit if status is SENT or PAID (shows error)

### Send Invoice
- [ ] Send Invoice button works
- [ ] Confirmation dialog appears
- [ ] Status changes to SENT
- [ ] Issued date set to current date
- [ ] Cannot edit after sending (shows error)
- [ ] Success toast appears

## Payment Management (US-PAY-001 to US-PAY-004)

### Record Payment
- [ ] Record Payment button works
- [ ] Form pre-populates invoice ID
- [ ] Amount field validates (positive number)
- [ ] Payment method dropdown works
- [ ] Notes field optional
- [ ] Form submits successfully
- [ ] Success toast appears
- [ ] Redirects to invoice detail
- [ ] Balance updates correctly
- [ ] Payment appears in payments list

### Payment Validation
- [ ] Cannot record payment for DRAFT invoice (shows error)
- [ ] Cannot overpay (shows error message)
- [ ] Partial payments work correctly
- [ ] Invoice status changes to PAID when balance = 0
- [ ] Multiple payments accumulate correctly

### View Payment
- [ ] Payment details display correctly
- [ ] All fields shown (amount, method, date, notes)
- [ ] Invoice link works
- [ ] Created timestamp shown

## Edge Cases

### Invoice Edge Cases
- [ ] Cannot edit SENT invoice (shows error)
- [ ] Cannot edit PAID invoice (shows error)
- [ ] Cannot send invoice without line items (shows error)
- [ ] Cannot send invoice that's already SENT (shows error)
- [ ] Invoice number format correct (INV-YYYY-NNNN)

### Payment Edge Cases
- [ ] Cannot pay DRAFT invoice (shows error)
- [ ] Overpayment rejected (shows error)
- [ ] Exact payment amount works
- [ ] Multiple partial payments work
- [ ] Payment date set correctly

### Data Integrity
- [ ] Customer deletion/deactivation doesn't break invoices
- [ ] Invoice deletion doesn't break payments
- [ ] Balance calculations always correct
- [ ] Status transitions follow correct flow

## UI/UX

### Responsive Design
- [ ] Mobile view works (iPhone)
- [ ] Tablet view works (iPad)
- [ ] Desktop view works
- [ ] Forms usable on mobile
- [ ] Tables scrollable on mobile
- [ ] Navigation works on mobile

### Error Handling
- [ ] Network errors show user-friendly message
- [ ] Validation errors show inline
- [ ] 404 errors handled gracefully
- [ ] 500 errors handled gracefully
- [ ] Error toasts dismissible

### Performance
- [ ] Page loads quickly
- [ ] No console errors
- [ ] No console warnings
- [ ] Smooth transitions
- [ ] Loading states shown

## Cross-Browser Testing

### Chrome
- [ ] All features work
- [ ] No visual issues
- [ ] No console errors

### Firefox
- [ ] All features work
- [ ] No visual issues
- [ ] No console errors

### Safari
- [ ] All features work
- [ ] No visual issues
- [ ] No console errors

### Mobile Browsers
- [ ] Chrome Mobile works
- [ ] Safari Mobile works
- [ ] Touch interactions work

## Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader friendly (if applicable)
- [ ] Color contrast sufficient
- [ ] Focus indicators visible
- [ ] Form labels associated correctly

