Here is a concise, implementation-ready README you can drop in the repo (e.g. `docs/STORE_IMPLEMENTATION_PLAN.md`) that describes the store section, three configurable templates, and required configurations.

# README: Store implementation plan

## Purpose

Provide a single-source-of-truth store configuration flow so businesses can create and manage stores from the mobile app and publish a matching web storefront built from a template. This document explains architecture, three template components, required config, API surface, UI responsibilities, validation, and rollout steps.

## Contents

- Overview
- Templates (3)
- Data model (store record)
- Required configuration fields
- API endpoints
- Mobile UI responsibilities
- Web storefront responsibilities
- Publish / preview workflow
- Roles, permissions & validation
- Migration & versioning
- Testing & acceptance criteria
- Rollout checklist
- Example store config (JSON)

## Overview

- Mobile app is an admin/config UI and preview/publish tool.
- Web storefront renders published snapshots (templateId + store config).
- One canonical store object in DB holds config, assets, template linkage and versions.

## Templates (three)

1. Retail POS Template

   - Target: physical merchants (products, inventory, discounts, receipts).
   - Key features: SKU tracking, stock warnings, POS checkout, receipts, tax rules, multi-payment support.
   - UI expectations: product grid/list, quick-add qty, cart drawer, receipt preview.

2. Service / Appointment Template

   - Target: service providers (bookings, staff scheduling, durations).
   - Key features: appointment lead time, staff assignment, calendar, time-slot booking, cancellation rules.
   - UI expectations: service list, booking flow, calendar sync, appointment confirmations.

3. Marketplace / Multi-vendor Template

   - Target: multiple vendors under one storefront (catalog by vendor, split payouts).
   - Key features: vendor onboarding, vendor-specific shipping/fees, product moderation, payout schedule.
   - UI expectations: vendor storefront pages, vendor filter, shared cart with vendor-breakdown at checkout.

## Data model (Store record) — core fields

- id: string
- ownerId: string
- name: string
- slug: string
- templateId: string (links to one of the templates)
- status: "draft" | "published" | "archived"
- config: object (see Required configuration fields)
- assets: [{ id, type, url }]
- versions: [{ version, snapshot, createdAt, createdBy }]
- previewToken?: string
- publishedAt?: ISOString

## Required configuration fields (config object)

- metadata: { name, description, timezone, locale, currency }
- ui: { themeTokens: { primary, accent, background, text, surface }, layoutChoice }
- payments: { acceptedMethods:[], requirePinForRefund:boolean, providerConfig:{} }
- inventory: { enabled:boolean, skuRequired:boolean, trackSerialNumbers:boolean, stockWarningThreshold:int }
- pricing: { taxEnabled:boolean, pricesIncludeTax:boolean, taxRules:[{id,name,rate,appliesTo}] }
- scheduling (service template only): { enabled, defaultDuration, leadTimeMinutes, cancelWindowHours }
- receipts: { includeLogo, footerText, showTaxBreakdown }
- notifications: { emailReceipts, smsReminders, pushNotifications }
- integrations: { accountingId?, analyticsId?, paymentProviderId? }
- roles: [ { id, name, permissions[] } ]
- seedData (optional): { sampleProductsOrServices: [...] }

## API endpoints (recommended)

- GET /api/stores/:id — returns draft or published depending on auth + query
- PATCH /api/stores/:id — update draft config (owner/manager)
- POST /api/stores/:id/preview — create preview token, return previewUrl
- POST /api/stores/:id/publish — validate, snapshot as published version
- GET /public/:slug — serve published snapshot (read-only)
- POST /api/stores/:id/assets — upload/store asset, returns url
- GET /api/stores/:id/versions — list published/draft versions
- POST /api/stores/:id/rollback — rollback to a version

## Mobile UI responsibilities

- Full config editor (metadata, theme, payments, inventory toggles, tax rules).
- Template selection and guided setup flows (wizard).
- Seed-data quick import (sample products/services).
- Preview button (opens web preview using previewToken).
- Publish / Unpublish actions (with confirmation).
- Version history list + basic diff view for critical fields.
- Role management UI (owner/manager/cashier).
- Validation UI for required fields before publish.

## Web storefront responsibilities

- Accept `templateId` + store `snapshot` (published config) and render UI.
- Use tokens to theme UI (primary, accent, background, text).
- Render behavior differences per template (POS vs service vs marketplace).
- Read-only for production; preview accepts previewToken and renders draft.

## Publish / preview workflow

1. Create or update store on mobile -> save draft.
2. Request preview -> server returns `previewToken` + previewUrl (short lived).
3. User opens previewUrl (web template reads draft by token).
4. When ready, user selects Publish -> server validates and creates published snapshot and sets `publishedAt`.
5. Web public path `/public/:slug` serves published snapshot.

## Roles & permissions

- Owner: full access (publish, unpublish, manage roles).
- Manager: edit config, preview, cannot publish (optional).
- Cashier / Service-staff: limited (pos actions, view, no publish).
- Enforce role checks on API and UI.

## Validation & server-side rules

- Required fields before publish: name, slug, currency, timezone, templateId, at least one payment method, themeTokens.primary.
- Schema validation for tax rules, currency codes (ISO), timezone (IANA).
- Asset URLs must be on approved CDN or storage.
- Prevent publish if inventory enabled + skuRequired false (config conflict).

## Migration & versioning

- Store record keeps `versions[]` with createdBy & createdAt.
- Each publish creates an immutable snapshot used by public storefront.
- Include `schemaVersion` inside snapshot for template migrations.
- Provide migration scripts to upgrade old snapshots to new schemaVersion.

## Testing & QA

- Unit tests: config validation, publish/preview APIs, role checks.
- Integration tests: previewToken flow, published snapshot rendering.
- Manual test cases: retail checkout flows, appointment booking flows, vendor checkout split (marketplace).
- E2E: mobile config -> preview -> edit -> publish -> public web storefront must reflect changes.

## Acceptance criteria

- Admins can create/store config, generate preview URL, and publish.
- Web storefront renders published snapshot with matching theme tokens and layout.
- Filter chips and transaction UI must match mobile spec: horizontally scrollable, active chips have colored border, 44x44 touch targets.
- Publish creates snapshot; preview token works and expires.

## Rollout checklist

- [ ] Backend: store table + versions + endpoints
- [ ] Storage: CDN/upload endpoint and CORS config
- [ ] Web templates: accept config snapshot + preview token
- [ ] Mobile: store config editor screens + preview/publish buttons
- [ ] Access controls: roles and audit logs
- [ ] Tests: unit/integration/E2E
- [ ] Monitoring: error logs for publish/preview endpoints

## Example store config (JSON snippet)

```json
{
  "id": "store_abc123",
  "ownerId": "user_01",
  "templateId": "retail-pos-v1",
  "status": "draft",
  "config": {
    "metadata": {
      "name": "Akin Store",
      "currency": "NGN",
      "timezone": "Africa/Lagos",
      "locale": "en-NG"
    },
    "ui": {
      "themeTokens": {
        "primary": "#0057FF",
        "accent": "#00C48C",
        "background": "#FFFFFF",
        "text": "#111827",
        "surface": "#F8FAFC"
      },
      "layoutChoice": "grid"
    },
    "payments": {
      "acceptedMethods": ["card", "cash", "mobile_money"],
      "requirePinForRefund": true
    },
    "inventory": {
      "enabled": true,
      "skuRequired": true,
      "stockWarningThreshold": 3,
      "trackSerialNumbers": false
    },
    "pricing": {
      "taxEnabled": true,
      "pricesIncludeTax": false,
      "taxRules": [
        {
          "id": "vat",
          "name": "VAT",
          "rate": 7.5,
          "appliesTo": ["product", "service"]
        }
      ]
    },
    "receipts": {
      "includeLogo": true,
      "footerText": "Thank you for your business",
      "showTaxBreakdown": true
    },
    "notifications": {
      "emailReceipts": true,
      "smsReminders": false,
      "pushNotifications": true
    }
  }
}
```

## Next steps (pick one)

- I can draft the Prisma/SQL schema + API route handlers next.
- I can scaffold mobile config screens (component props + RN StyleSheet snippets).
- I can implement preview-token flow (backend) with example endpoint handlers.

Which of the next steps should I implement now?
