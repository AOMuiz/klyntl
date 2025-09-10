# Invoicing Module — Full Feature Specification

## Overview

A standalone Invoicing module designed to integrate into the KLYNTL ecosystem or run independently for Nigerian SMEs. Focused on creating, sending, tracking and reconciling invoices with strong support for offline-first mobile behavior, payment-provider automation, and country-specific compliance (Nigerian VAT/tax). The module is intentionally scoped to invoicing and financial document workflows (not full accounting), and provides export hooks for accounting systems.

## Product Vision

Provide micro and small businesses a simple, reliable way to issue legally-compliant invoices, accept and reconcile payments, and track receivables — all with a mobile-first, offline-capable experience tailored to the Nigerian market.

## Core Principles

- Mobile-first and offline-capable (local SQLite + sync queue)
- Clear UX for quick invoice creation and payment reconciliation
- Canonical server-side invoice numbers for compliance
- Seamless sharing (WhatsApp, Email, SMS) with PDF generation
- Extensible integrations: payment gateways, storage (S3), and accounting exports

## Target Users

- Market stall owners, informal retailers, small professional services, and SMEs in Nigeria who need simple invoicing without complex accounting.

## Key Features (Complete List)

### Invoice Creation & Editing

- Create invoices from scratch
- Create from Customer Profile or convert Store Order → Invoice
- Line items with product lookup, description, quantity, unit price, discount, and tax per line
- Multiple tax types (VAT, local levies) and percentage/exempt handling
- Invoice metadata: issue date, due date, payment terms, currency, exchange rate
- Drafts and autosave
- Clone invoice / copy previous invoice

### Templates & Presentation

- Multiple invoice templates (simple, detailed, receipt-style)
- Business header (logo upload, business name, address, tax ID)
- Customizable footer and legal text
- Localized number and currency formatting (₦, thousand separators, 2 decimal places)

### Numbering & Compliance

- Server-assigned canonical invoice numbers (policy: server wins) and local temporary numbers when offline
- Custom invoice series and prefixes (e.g., INV-2025-{{seq}})
- Support for tax identification display (TIN) & mandatory fields for compliance

### PDF Generation & Sharing

- Client-side PDF generation for immediate sharing (offline-capable)
- Server storage of canonical PDF once synced (S3 or equivalent)
- Share via WhatsApp (deep-link), Email (backend send or client mail composer), SMS with invoice link
- Download / save as PDF to device
- Attach payment instructions and payment links (Paystack/Flutterwave) in PDFs

### Sending & Delivery Tracking

- Send via backend email/SMS for delivery tracking and opened/viewed events when supported
- Track send history (sent, delivered, opened) when provider supports events
- Retry scheduling for failed sends

### Payments & Reconciliation

- Record payments against invoices (partial/full payments)
- Multiple payment methods (cash, bank transfer, POS, mobile money, card, USSD)
- Support for payment references and attachments (receipt photos)
- Auto-reconcile via payment provider webhooks (Paystack/Flutterwave)
- Mark invoice states: Draft, Sent, Partially Paid, Paid, Overdue, Cancelled, Refunded
- Create credit notes and link to original invoices

### Recurring Invoices & Subscriptions

- Create recurring invoice schedules (daily, weekly, monthly, custom)
- Auto-generate and optionally auto-send recurring invoices
- Retry logic for failed sends and failed auto-pay attempts

### Customer Integration

- Link invoices to Customer records (existing CRM) with contact pre-fill
- Quick customer search and add-new-customer flow inside invoice editor
- Store multiple contact methods per customer (email, phone, alternative contacts)

### Offline-first & Sync

- Local SQLite storage for invoices, items, payments, and send queue
- Outbound queue for operations to sync (create/edit/send/payment)
- Conflict resolution rules (server wins for canonical identifiers and payment webhook events; client wins for draft edits)
- Manual "Sync now" and background sync when online

### Integrations

- Payment providers: Paystack, Flutterwave, optional: Stripe, PayPal (webhooks + payment links)
- SMS: Termii, SMSLive247 (for reminders or invoice links)
- Email: SendGrid or SMTP for sending PDFs
- Storage: AWS S3 (canonical PDFs) or equivalent
- Accounting export: CSV, XLSX, or QuickBooks/Xero format (via mapping)

### Notifications & Reminders

- Automatic overdue reminders (configurable cadence: 3, 7, 14 days)
- Push notifications for payment received, invoice overdue, recurring invoice issued
- In-app notification center with history

### Analytics & Reports

- KPIs: Total invoiced, Amount outstanding, Overdue amounts, Average days-to-pay, Top debtors, Invoice aging buckets
- Filters by date range, customer, tag, status
- Exportable reports (CSV/PDF)

### Security & Data Protection

- Encryption at rest for sensitive PII and PDFs
- Secure transport (HTTPS/TLS) for all backend calls
- Local key storage (Keychain/Keystore) for secrets
- Audit logs for critical invoice events (create, send, pay, cancel)
- Role-based permissions (basic: owner, accountant, viewer)

### UX / UI Screens

- Invoices List (filters: status, customer, date range)
- Invoice Detail (line items, payments, send history, PDF preview)
- Create/Edit Invoice screen with product picker and customer search
- Record Payment modal
- Recurring Invoice manager
- Settings: numbering, tax rates, template, business details
- Reports / Analytics dashboard

### Business & Billing

- Freemium limits (e.g., up to 100 invoices per month free) or tiered subscriptions
- Per-message charge for SMS sends (if backend sends SMS)
- Transaction fee handling for payment gateway integration (displayed, optional pass-through)

### Localization & Nigerian Market Adaptations

- Nigerian Naira formatting and currency symbol (₦)
- Nigerian phone number validation (+234) for sending SMS/WhatsApp
- VAT/tax support with local law-compliant fields
- Pre-built payment provider integrations popular in Nigeria (Paystack, Flutterwave)

## Data Model (Minimal)

- invoices: id, tenant_id, customer_id, local_number, canonical_number, status, issue_date, due_date, subtotal, tax_total, total, currency, notes, template_id, created_at, updated_at
- invoice_items: id, invoice_id, product_id|null, description, qty, unit_price, discount, tax_amount, line_total
- invoice_payments: id, invoice_id, amount, method, reference, paid_at, attachment_url
- invoice_events: id, invoice_id, event_type, metadata, created_at
- recurring_invoices: id, invoice_template_data (serialized), cadence, next_run, active

## API Endpoints (Example)

- GET /invoices
- GET /invoices/:id
- POST /invoices
- PUT /invoices/:id
- POST /invoices/:id/send (email/sms/whatsapp)
- POST /invoices/:id/payments
- POST /invoices/:id/record-payment
- POST /invoices/:id/recurring
- GET /reports/invoices
- Webhook: POST /webhooks/payment-provider

## Offline Behaviour & Conflict Rules (Summary)

- Draft creation and edits: saved locally and synced later
- Canonical numbering: assigned by server on first successful sync; clients use temporary numbers locally
- Payment webhooks: server authoritative for payment status; client should refresh/sync on webhook events
- Merge strategy: last-write-wins for non-critical fields, server-precedence for payments/webhooks

## MVP (Minimal Viable Scope)

1. Local invoice create/edit/drafts with product and customer pickers
2. Client-side PDF generation and share via WhatsApp/email compose
3. Record payments manually and update invoice status
4. Sync to backend with server-side canonical number assignment
5. Basic payment webhook endpoint to auto-mark paid (one provider: Paystack)
6. Invoices list and invoice detail screens

## Phase 2 / Nice-to-have

- Recurring invoices with auto-send and auto-pay
- Delivery tracking (email open/view events)
- Accounting integrations (Xero, QuickBooks) and advanced export formats
- Bulk invoice import/export
- Credit notes and reversal workflows
- Auto-collection via payment provider mandates (where supported)
- Multi-tenant / multi-business support

## Acceptance Criteria (Example)

- Users can create and save invoice drafts offline and view them in a list
- Users can generate a PDF locally and share it via WhatsApp without network
- When online, invoices sync to server and receive canonical numbers
- Payment webhooks mark invoices as paid in the system and create payment records
- Overdue invoices show in Reports and trigger a reminder after configured days

## Security & Compliance Checklist

- TLS enforced for all endpoints
- PDF and PII encrypted at rest on server and device
- Server assigns canonical invoice numbers for legal compliance
- Maintain audit trail for invoice lifecycle events

## Migration & Integration Notes

- If integrating into existing KLYNTL CRM: reuse Customers table and product catalog
- Add foreign keys to link invoices to existing transactions and orders
- Provide a migration script to convert existing transaction records to invoice records where appropriate

## Developer Notes

- Client: React Native with SQLite local store and sync queue (consistent with KLYNTL architecture)
- Backend: Node.js/Express or similar; PostgreSQL as canonical store; Redis for transient caches
- Use job scheduler (cron/worker) for recurring invoice issuance
- Use server-assigned invoice numbering service to ensure sequentiality across devices

---

This document should be added to the repository at `docs/invoicing_module.md` as the canonical feature specification for the standalone Invoicing module.
