# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This repo is a frontend-only prototype for 长安银科保险管理系统 (Chang'an Inkasso export-credit insurance management system). The actual app lives in `cayk-bx-ui/`; the top-level `doc/` directory holds the Chinese-language product spec, requirements, field dictionaries, and process diagrams that drive feature work.

- `cayk-bx-ui/` — Vue 3 SPA (run all npm commands from here)
- `doc/长安银科保险管理系统_产品原型设计文档_v2.0.md` — current product spec, the source of truth for menus, roles, statuses, and business rules
- `doc/原始需求.txt`, `doc/原始需求字段信息.md` — original requirements + field dictionary by module

## Commands

All commands run from `cayk-bx-ui/`:

```bash
npm install          # first-time setup
npm run dev          # Vite dev server on 0.0.0.0:3000, opens browser
npm run build        # production build → cayk-bx-ui/dist
npm run preview      # serve the built dist
```

There is no lint, test, or typecheck script — none configured.

## Architecture

### Tech stack
Vue 3 (Composition API) · Vite 5 · Vue Router 4 · Pinia · TDesign Vue Next (`tdesign-vue-next` + `tdesign-icons-vue-next`) · SCSS · `xlsx` for Excel generation · `echarts` + `vue-echarts` for charts. Path alias `@` → `cayk-bx-ui/src`.

### No backend — Pinia is the data layer
`src/api/modules/` is empty. The entire app reads and mutates state through `src/stores/business.js` (≈1700 lines), which seeds mock data via `ensureSeeded()` on first use and exposes ~30 actions (`createOrUpdateInsuranceApplication`, `submitInsuranceApplication`, `approveInsuranceApplication`, `createCreditLimit`, `createShipment`, `createClaim`, `inkassoSignContract`, `processPayment`, etc.). When adding a feature, extend this store rather than introducing an HTTP layer.

The top of `business.js` also contains the shared date/deadline helpers (`computeShipmentDeadline`, `isOverdueByDeadline`, `normalizeShipment`) — reuse these instead of reimplementing date math. Hong Kong shipments use a 3-day deadline; "monthly" declarations roll to the 10th of the next month; everything else is shipment date + 15 days.

User identity/role lives in `src/stores/user.js`, persisted to `localStorage` under `cayk_role`. Three hard-coded roles: `customer`, `inkasso` (长安银科 staff), `clerk` (跟单员).

### Routing & role gating — two places to update
Adding or moving a page requires changes in **both** files; they are not derived from each other:

1. `src/router/index.js` — flat list of routes under `MainLayout`, each with `meta: { title, menuKey, roles: [...] }`. A global `router.beforeEach` redirects users without the required role to `/insurance/purchase` (customer) or `/policy/list` (others).
2. `src/layouts/MainLayout.vue` — the sidebar menu is a hard-coded `menuItems` array (~grouped under `insurance` / `policy` / `claim` / `clerk` / `stats`), each entry duplicating the same `roles` list. `filteredMenuItems` filters by `userStore.role`; the header's role-switch radio group writes through `userStore.setRole`. Forgetting to update this file will leave the route reachable by URL but invisible in the nav.

### Pages by module
`src/pages/` is organized by business module — `insurance/` (投保: 投保信息管理, 投保需求问卷, 投保流程管理, 报表), `policy/` (保单: 保单信息, 合同签署, 贸易/限额/出运/补贴/履约, 流程管理), `claim/` (理赔), `clerk/` (跟单员管理), `statistics/` (业务/风险报表). The same page is often rendered for multiple roles with role-specific columns or actions; check `userStore.role` inside the component rather than splitting into separate files.

### Shared building blocks
- `src/components/common/` — `DataTable`, `DetailPanel`, `SearchFilter`, `StatCard`, `StatusTag`, `EmptyState`. Prefer extending these over building new list/detail scaffolding.
- `src/components/business/` — domain dialogs (`PolicyOcrDialog`, `PolicyChangeDialog`, `RenewalDialog`, `SurrenderDialog`, `ExternalPolicyUploadDialog`) that wrap the store actions for the policy lifecycle.
- `src/components/form/InsuranceForm.vue` — the large investor-information form shared between create/edit/detail routes.
- `src/utils/rules/` — TDesign form validation rule sets per module (`premiumRules`, `claimRules`, `creditLimitRules`, `shipmentRules`).
- `src/utils/templateFiller.js` — generates 保单申请书 (PICC layout, 206×19 cells) and 买方信息表 as `.xlsx` via the `xlsx` package, using templates from `public/templates/`. The cell coordinates match the printed forms exactly — do not re-flow rows without checking the originals.

### Status vocabularies
Statuses are Chinese-business-specific strings stored on records (e.g., insurance: `draft`, `pending_material`, `pending_submit`, `credit_investigating`, `limit_approving`, `underwriting`, `pending_payment`, `completed`, `rejected`; shipments: `declared`, `completed`, `timeout_warning`). When adding a new status, update both the store transitions and the `StatusTag` / column rendering in the affected pages; the product doc in `doc/` lists the canonical state for each module.

## Conventions

- UI text and field labels are Chinese. Keep new strings consistent with the product doc's terminology rather than translating.
- IDs are generated by `createId(prefix)` in `business.js` (prefix + `YYYYMMDDHHMMSS`).
- The committed `cayk-bx-ui/dist/` is a built artifact — regenerate with `npm run build` rather than hand-editing.
