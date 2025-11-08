import type { Customer, Invoice, Payment } from "@/lib/types"
import type { CustomerService, InvoiceService, PaymentService } from "./contracts"

// Simulate network latency
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// In-memory storage
let customers: Customer[] = []
let invoices: Invoice[] = []
let payments: Payment[] = []
const idCounters = { customer: 10, invoice: 20, payment: 15, lineItem: 100 }

// Seed fixture data
function seedData() {
  // 10 customers
  customers = [
    {
      id: "c1",
      name: "Acme Corp",
      email: "billing@acme.com",
      billingAddress: "123 Main St, New York, NY 10001",
      isActive: true,
      createdAt: "2025-01-01T10:00:00Z",
      updatedAt: "2025-01-01T10:00:00Z",
    },
    {
      id: "c2",
      name: "TechStart Inc",
      email: "contact@techstart.com",
      billingAddress: "456 Tech Ave, San Francisco, CA 94105",
      isActive: true,
      createdAt: "2025-01-02T10:00:00Z",
      updatedAt: "2025-01-02T10:00:00Z",
    },
    {
      id: "c3",
      name: "Global Solutions",
      email: "billing@globalsol.com",
      billingAddress: "789 Global Blvd, Chicago, IL 60601",
      isActive: true,
      createdAt: "2025-01-03T10:00:00Z",
      updatedAt: "2025-01-03T10:00:00Z",
    },
    {
      id: "c4",
      name: "Digital Ventures",
      email: "finance@digitalventures.io",
      billingAddress: "321 Digital Lane, Austin, TX 78701",
      isActive: true,
      createdAt: "2025-01-04T10:00:00Z",
      updatedAt: "2025-01-04T10:00:00Z",
    },
    {
      id: "c5",
      name: "CloudFirst Systems",
      email: "accounts@cloudfirst.com",
      billingAddress: "654 Cloud Way, Seattle, WA 98101",
      isActive: true,
      createdAt: "2025-01-05T10:00:00Z",
      updatedAt: "2025-01-05T10:00:00Z",
    },
    {
      id: "c6",
      name: "Enterprise Plus",
      email: "billing@enterpriseplus.com",
      billingAddress: "987 Enterprise Dr, Boston, MA 02101",
      isActive: true,
      createdAt: "2025-01-06T10:00:00Z",
      updatedAt: "2025-01-06T10:00:00Z",
    },
    {
      id: "c7",
      name: "Innovation Labs",
      email: "contact@innovationlabs.com",
      billingAddress: "147 Innovation Pkwy, Denver, CO 80202",
      isActive: true,
      createdAt: "2025-01-07T10:00:00Z",
      updatedAt: "2025-01-07T10:00:00Z",
    },
    {
      id: "c8",
      name: "Future Corp",
      email: "billing@futurecorp.com",
      billingAddress: "258 Future St, Miami, FL 33101",
      isActive: true,
      createdAt: "2025-01-08T10:00:00Z",
      updatedAt: "2025-01-08T10:00:00Z",
    },
    {
      id: "c9",
      name: "Old Client Inc",
      email: "old@example.com",
      billingAddress: "369 Old Way, Portland, OR 97201",
      isActive: false,
      createdAt: "2024-06-01T10:00:00Z",
      updatedAt: "2024-12-01T10:00:00Z",
    },
    {
      id: "c10",
      name: "Retired Services",
      email: "retired@example.com",
      billingAddress: "741 Retired Ave, Phoenix, AZ 85001",
      isActive: false,
      createdAt: "2024-05-01T10:00:00Z",
      updatedAt: "2024-11-01T10:00:00Z",
    },
  ]

  // 20 invoices (5 DRAFT, 10 SENT, 5 PAID)
  invoices = [
    // DRAFT invoices
    {
      id: "i1",
      customerId: "c1",
      invoiceNumber: "INV-2025-0001",
      status: "DRAFT",
      total: 5000,
      balance: 5000,
      dueDate: "2025-02-15",
      lineItems: [{ id: "li1", description: "Professional Services", quantity: 5, unitPrice: 1000, amount: 5000 }],
      createdAt: "2025-01-10T10:00:00Z",
      updatedAt: "2025-01-10T10:00:00Z",
    },
    {
      id: "i2",
      customerId: "c2",
      invoiceNumber: "INV-2025-0002",
      status: "DRAFT",
      total: 3500,
      balance: 3500,
      dueDate: "2025-02-20",
      lineItems: [
        { id: "li2", description: "Software License", quantity: 1, unitPrice: 3000, amount: 3000 },
        { id: "li3", description: "Support Hours", quantity: 5, unitPrice: 100, amount: 500 },
      ],
      createdAt: "2025-01-11T10:00:00Z",
      updatedAt: "2025-01-11T10:00:00Z",
    },
    {
      id: "i3",
      customerId: "c3",
      invoiceNumber: "INV-2025-0003",
      status: "DRAFT",
      total: 2500,
      balance: 2500,
      dueDate: "2025-02-25",
      lineItems: [{ id: "li4", description: "Consulting", quantity: 2, unitPrice: 1250, amount: 2500 }],
      createdAt: "2025-01-12T10:00:00Z",
      updatedAt: "2025-01-12T10:00:00Z",
    },
    {
      id: "i4",
      customerId: "c4",
      invoiceNumber: "INV-2025-0004",
      status: "DRAFT",
      total: 4200,
      balance: 4200,
      dueDate: "2025-02-10",
      lineItems: [{ id: "li5", description: "Development Services", quantity: 3, unitPrice: 1400, amount: 4200 }],
      createdAt: "2025-01-13T10:00:00Z",
      updatedAt: "2025-01-13T10:00:00Z",
    },
    {
      id: "i5",
      customerId: "c5",
      invoiceNumber: "INV-2025-0005",
      status: "DRAFT",
      total: 3800,
      balance: 3800,
      dueDate: "2025-02-28",
      lineItems: [{ id: "li6", description: "Cloud Services", quantity: 1, unitPrice: 3800, amount: 3800 }],
      createdAt: "2025-01-14T10:00:00Z",
      updatedAt: "2025-01-14T10:00:00Z",
    },
    // SENT invoices
    {
      id: "i6",
      customerId: "c1",
      invoiceNumber: "INV-2025-0006",
      status: "SENT",
      total: 6000,
      balance: 6000,
      dueDate: "2025-02-05",
      lineItems: [{ id: "li7", description: "Maintenance Services", quantity: 4, unitPrice: 1500, amount: 6000 }],
      createdAt: "2025-01-15T10:00:00Z",
      updatedAt: "2025-01-15T10:00:00Z",
    },
    {
      id: "i7",
      customerId: "c2",
      invoiceNumber: "INV-2025-0007",
      status: "SENT",
      total: 2800,
      balance: 2800,
      dueDate: "2025-02-01",
      lineItems: [{ id: "li8", description: "Training Session", quantity: 1, unitPrice: 2800, amount: 2800 }],
      createdAt: "2025-01-16T10:00:00Z",
      updatedAt: "2025-01-16T10:00:00Z",
    },
    {
      id: "i8",
      customerId: "c3",
      invoiceNumber: "INV-2025-0008",
      status: "SENT",
      total: 4500,
      balance: 4500,
      dueDate: "2025-02-12",
      lineItems: [{ id: "li9", description: "Integration Work", quantity: 3, unitPrice: 1500, amount: 4500 }],
      createdAt: "2025-01-17T10:00:00Z",
      updatedAt: "2025-01-17T10:00:00Z",
    },
    {
      id: "i9",
      customerId: "c4",
      invoiceNumber: "INV-2025-0009",
      status: "SENT",
      total: 3200,
      balance: 3200,
      dueDate: "2025-02-08",
      lineItems: [{ id: "li10", description: "API Development", quantity: 2, unitPrice: 1600, amount: 3200 }],
      createdAt: "2025-01-18T10:00:00Z",
      updatedAt: "2025-01-18T10:00:00Z",
    },
    {
      id: "i10",
      customerId: "c5",
      invoiceNumber: "INV-2025-0010",
      status: "SENT",
      total: 5500,
      balance: 5500,
      dueDate: "2025-02-03",
      lineItems: [{ id: "li11", description: "Infrastructure Setup", quantity: 1, unitPrice: 5500, amount: 5500 }],
      createdAt: "2025-01-19T10:00:00Z",
      updatedAt: "2025-01-19T10:00:00Z",
    },
    {
      id: "i11",
      customerId: "c6",
      invoiceNumber: "INV-2025-0011",
      status: "SENT",
      total: 4100,
      balance: 2050,
      dueDate: "2025-02-06",
      lineItems: [{ id: "li12", description: "Security Audit", quantity: 1, unitPrice: 4100, amount: 4100 }],
      createdAt: "2025-01-20T10:00:00Z",
      updatedAt: "2025-01-20T10:00:00Z",
    },
    {
      id: "i12",
      customerId: "c7",
      invoiceNumber: "INV-2025-0012",
      status: "SENT",
      total: 3900,
      balance: 3900,
      dueDate: "2025-02-09",
      lineItems: [{ id: "li13", description: "Testing & QA", quantity: 2, unitPrice: 1950, amount: 3900 }],
      createdAt: "2025-01-21T10:00:00Z",
      updatedAt: "2025-01-21T10:00:00Z",
    },
    {
      id: "i13",
      customerId: "c8",
      invoiceNumber: "INV-2025-0013",
      status: "SENT",
      total: 5200,
      balance: 5200,
      dueDate: "2025-02-11",
      lineItems: [{ id: "li14", description: "Architecture Design", quantity: 1, unitPrice: 5200, amount: 5200 }],
      createdAt: "2025-01-22T10:00:00Z",
      updatedAt: "2025-01-22T10:00:00Z",
    },
    {
      id: "i14",
      customerId: "c1",
      invoiceNumber: "INV-2025-0014",
      status: "SENT",
      total: 2300,
      balance: 2300,
      dueDate: "2025-02-14",
      lineItems: [{ id: "li15", description: "Bug Fixes", quantity: 1, unitPrice: 2300, amount: 2300 }],
      createdAt: "2025-01-23T10:00:00Z",
      updatedAt: "2025-01-23T10:00:00Z",
    },
    {
      id: "i15",
      customerId: "c2",
      invoiceNumber: "INV-2025-0015",
      status: "SENT",
      total: 4700,
      balance: 4700,
      dueDate: "2025-02-16",
      lineItems: [{ id: "li16", description: "Documentation", quantity: 1, unitPrice: 4700, amount: 4700 }],
      createdAt: "2025-01-24T10:00:00Z",
      updatedAt: "2025-01-24T10:00:00Z",
    },
    // PAID invoices
    {
      id: "i16",
      customerId: "c3",
      invoiceNumber: "INV-2024-0100",
      status: "PAID",
      total: 3000,
      balance: 0,
      dueDate: "2025-01-10",
      lineItems: [{ id: "li17", description: "Completed Project", quantity: 1, unitPrice: 3000, amount: 3000 }],
      createdAt: "2024-12-10T10:00:00Z",
      updatedAt: "2025-01-15T10:00:00Z",
    },
    {
      id: "i17",
      customerId: "c4",
      invoiceNumber: "INV-2024-0101",
      status: "PAID",
      total: 2500,
      balance: 0,
      dueDate: "2025-01-12",
      lineItems: [{ id: "li18", description: "Delivered Services", quantity: 1, unitPrice: 2500, amount: 2500 }],
      createdAt: "2024-12-12T10:00:00Z",
      updatedAt: "2025-01-18T10:00:00Z",
    },
    {
      id: "i18",
      customerId: "c5",
      invoiceNumber: "INV-2024-0102",
      status: "PAID",
      total: 4000,
      balance: 0,
      dueDate: "2025-01-08",
      lineItems: [{ id: "li19", description: "Milestone 1", quantity: 1, unitPrice: 4000, amount: 4000 }],
      createdAt: "2024-12-08T10:00:00Z",
      updatedAt: "2025-01-20T10:00:00Z",
    },
    {
      id: "i19",
      customerId: "c6",
      invoiceNumber: "INV-2024-0103",
      status: "PAID",
      total: 3500,
      balance: 0,
      dueDate: "2025-01-05",
      lineItems: [{ id: "li20", description: "Implementation", quantity: 1, unitPrice: 3500, amount: 3500 }],
      createdAt: "2024-12-05T10:00:00Z",
      updatedAt: "2025-01-10T10:00:00Z",
    },
    {
      id: "i20",
      customerId: "c7",
      invoiceNumber: "INV-2024-0104",
      status: "PAID",
      total: 5000,
      balance: 0,
      dueDate: "2025-01-20",
      lineItems: [{ id: "li21", description: "Full Solution", quantity: 1, unitPrice: 5000, amount: 5000 }],
      createdAt: "2024-12-20T10:00:00Z",
      updatedAt: "2025-01-25T10:00:00Z",
    },
  ]

  // 15 payments
  payments = [
    { id: "p1", invoiceId: "i11", amount: 2050, paymentMethod: "Wire", createdAt: "2025-01-20T14:00:00Z" },
    { id: "p2", invoiceId: "i16", amount: 3000, paymentMethod: "ACH", createdAt: "2025-01-15T09:00:00Z" },
    { id: "p3", invoiceId: "i17", amount: 2500, paymentMethod: "Check", createdAt: "2025-01-18T11:00:00Z" },
    { id: "p4", invoiceId: "i18", amount: 4000, paymentMethod: "Wire", createdAt: "2025-01-20T13:00:00Z" },
    { id: "p5", invoiceId: "i19", amount: 3500, paymentMethod: "Card", createdAt: "2025-01-10T10:00:00Z" },
    { id: "p6", invoiceId: "i20", amount: 5000, paymentMethod: "ACH", createdAt: "2025-01-25T15:00:00Z" },
    { id: "p7", invoiceId: "i6", amount: 2000, paymentMethod: "Wire", createdAt: "2025-01-18T10:00:00Z" },
    { id: "p8", invoiceId: "i7", amount: 1400, paymentMethod: "Check", createdAt: "2025-01-19T14:00:00Z" },
    { id: "p9", invoiceId: "i8", amount: 2250, paymentMethod: "ACH", createdAt: "2025-01-20T09:00:00Z" },
    { id: "p10", invoiceId: "i9", amount: 3200, paymentMethod: "Wire", createdAt: "2025-01-21T11:00:00Z" },
    { id: "p11", invoiceId: "i10", amount: 2750, paymentMethod: "Card", createdAt: "2025-01-22T10:00:00Z" },
    { id: "p12", invoiceId: "i12", amount: 1950, paymentMethod: "ACH", createdAt: "2025-01-23T13:00:00Z" },
    { id: "p13", invoiceId: "i13", amount: 2600, paymentMethod: "Wire", createdAt: "2025-01-24T09:00:00Z" },
    { id: "p14", invoiceId: "i14", amount: 2300, paymentMethod: "Check", createdAt: "2025-01-25T10:00:00Z" },
    { id: "p15", invoiceId: "i15", amount: 2350, paymentMethod: "ACH", createdAt: "2025-01-25T14:00:00Z" },
  ]
}

// Helper to validate API key
function validateApiKey(key?: string) {
  if (key !== "demo-api-key-12345") {
    throw new Error("Invalid API Key")
  }
}

// Helper to paginate
function paginate<T>(items: T[], page: number, size: number) {
  const start = page * size
  const end = start + size
  return {
    data: items.slice(start, end),
    pagination: {
      page,
      size,
      total: items.length,
      totalPages: Math.ceil(items.length / size),
    },
  }
}

// Customer Service Implementation
export const mockCustomerService: CustomerService = {
  async list(params) {
    await delay(200)
    let filtered = customers
    if (params.includeInactive !== true) {
      filtered = filtered.filter((c) => c.isActive)
    }
    return paginate(filtered, params.page, params.size)
  },

  async get(id) {
    await delay(200)
    const customer = customers.find((c) => c.id === id)
    if (!customer) {
      throw { code: "NOT_FOUND", message: `Customer ${id} not found` }
    }
    return customer
  },

  async create(payload) {
    await delay(200)
    // Check for duplicate email
    if (payload.email && customers.some((c) => c.email === payload.email)) {
      throw {
        code: "DUPLICATE_EMAIL",
        message: `Email ${payload.email} already exists`,
      }
    }
    const id = `c${++idCounters.customer}`
    const now = new Date().toISOString()
    const customer: Customer = {
      id,
      name: payload.name,
      email: payload.email,
      billingAddress: payload.billingAddress,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }
    customers.push(customer)
    return customer
  },

  async update(id, payload) {
    await delay(200)
    const customer = customers.find((c) => c.id === id)
    if (!customer) {
      throw { code: "NOT_FOUND", message: `Customer ${id} not found` }
    }
    // Check for duplicate email
    if (payload.email && payload.email !== customer.email && customers.some((c) => c.email === payload.email)) {
      throw {
        code: "DUPLICATE_EMAIL",
        message: `Email ${payload.email} already exists`,
      }
    }
    const updated: Customer = {
      ...customer,
      ...(payload.name !== undefined && { name: payload.name }),
      ...(payload.email !== undefined && { email: payload.email }),
      ...(payload.billingAddress !== undefined && { billingAddress: payload.billingAddress }),
      updatedAt: new Date().toISOString(),
    }
    const index = customers.indexOf(customer)
    customers[index] = updated
    return updated
  },

  async deactivate(id) {
    await delay(200)
    const customer = customers.find((c) => c.id === id)
    if (!customer) {
      throw { code: "NOT_FOUND", message: `Customer ${id} not found` }
    }
    // Check if customer has unpaid invoices
    const unpaidInvoices = invoices.filter((i) => i.customerId === id && i.status !== "PAID")
    if (unpaidInvoices.length > 0) {
      throw {
        code: "UNPAID_INVOICES",
        message: `Cannot deactivate customer with unpaid invoices`,
      }
    }
    const updated = { ...customer, isActive: false, updatedAt: new Date().toISOString() }
    const index = customers.indexOf(customer)
    customers[index] = updated
    return updated
  },
}

// Invoice Service Implementation
export const mockInvoiceService: InvoiceService = {
  async list(params) {
    await delay(200)
    let filtered = invoices
    if (params.status) {
      filtered = filtered.filter((i) => i.status === params.status)
    }
    if (params.customerId) {
      filtered = filtered.filter((i) => i.customerId === params.customerId)
    }
    return paginate(filtered, params.page, params.size)
  },

  async get(id) {
    await delay(200)
    const invoice = invoices.find((i) => i.id === id)
    if (!invoice) {
      throw { code: "NOT_FOUND", message: `Invoice ${id} not found` }
    }
    return invoice
  },

  async create(payload) {
    await delay(200)
    const customer = customers.find((c) => c.id === payload.customerId)
    if (!customer) {
      throw {
        code: "CUSTOMER_NOT_FOUND",
        message: `Customer ${payload.customerId} not found`,
      }
    }
    const invoiceNumber = `INV-2025-${String(invoices.length + 1).padStart(4, "0")}`
    const total = payload.lineItems.reduce((sum, item) => sum + item.amount, 0)
    const id = `i${++idCounters.invoice}`
    const now = new Date().toISOString()
    const invoice: Invoice = {
      id,
      customerId: payload.customerId,
      invoiceNumber,
      status: "DRAFT",
      total,
      balance: total,
      dueDate: payload.dueDate,
      lineItems: payload.lineItems.map((item, idx) => ({
        ...item,
        id: `li${++idCounters.lineItem}`,
      })),
      createdAt: now,
      updatedAt: now,
    }
    invoices.push(invoice)
    return invoice
  },

  async update(id, payload) {
    await delay(200)
    const invoice = invoices.find((i) => i.id === id)
    if (!invoice) {
      throw { code: "NOT_FOUND", message: `Invoice ${id} not found` }
    }
    if (invoice.status !== "DRAFT") {
      throw {
        code: "INVALID_STATUS",
        message: "Can only edit invoices in DRAFT status",
      }
    }
    const updated: Invoice = {
      ...invoice,
      ...(payload.lineItems && {
        lineItems: payload.lineItems.map((item) => ({
          ...item,
          id: item.id || `li${++idCounters.lineItem}`,
        })),
        total: payload.lineItems.reduce((sum, item) => sum + item.amount, 0),
      }),
      ...(payload.dueDate && { dueDate: payload.dueDate }),
      updatedAt: new Date().toISOString(),
    }
    if (payload.lineItems) {
      updated.balance = updated.total
    }
    const index = invoices.indexOf(invoice)
    invoices[index] = updated
    return updated
  },

  async send(id) {
    await delay(200)
    const invoice = invoices.find((i) => i.id === id)
    if (!invoice) {
      throw { code: "NOT_FOUND", message: `Invoice ${id} not found` }
    }
    const updated = { ...invoice, status: "SENT" as const, updatedAt: new Date().toISOString() }
    const index = invoices.indexOf(invoice)
    invoices[index] = updated
    return updated
  },

  async getPayments(id) {
    await delay(200)
    const invoice = invoices.find((i) => i.id === id)
    if (!invoice) {
      throw { code: "NOT_FOUND", message: `Invoice ${id} not found` }
    }
    return payments.filter((p) => p.invoiceId === id)
  },
}

// Payment Service Implementation
export const mockPaymentService: PaymentService = {
  async create(payload) {
    await delay(200)
    const invoice = invoices.find((i) => i.id === payload.invoiceId)
    if (!invoice) {
      throw {
        code: "INVOICE_NOT_FOUND",
        message: `Invoice ${payload.invoiceId} not found`,
      }
    }
    if (payload.amount > invoice.balance) {
      throw {
        code: "OVERPAYMENT",
        message: `Payment amount exceeds outstanding balance`,
      }
    }
    const id = `p${++idCounters.payment}`
    const payment: Payment = {
      id,
      invoiceId: payload.invoiceId,
      amount: payload.amount,
      paymentMethod: payload.paymentMethod,
      createdAt: new Date().toISOString(),
    }
    payments.push(payment)

    // Update invoice balance
    const invoiceIndex = invoices.indexOf(invoice)
    const updatedInvoice = {
      ...invoice,
      balance: invoice.balance - payload.amount,
      status: invoice.balance - payload.amount === 0 ? ("PAID" as const) : invoice.status,
      updatedAt: new Date().toISOString(),
    }
    invoices[invoiceIndex] = updatedInvoice

    return payment
  },

  async get(id) {
    await delay(200)
    const payment = payments.find((p) => p.id === id)
    if (!payment) {
      throw { code: "NOT_FOUND", message: `Payment ${id} not found` }
    }
    return payment
  },
}

// Initialize mock data on module load
seedData()

// Export service registry
export const mockServices = {
  customers: mockCustomerService,
  invoices: mockInvoiceService,
  payments: mockPaymentService,
}
