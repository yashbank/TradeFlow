<div align="center">

<img src="assets/hero.svg" alt="TradeFlow" width="100%"/>

![Next.js 15](https://img.shields.io/badge/Next.js%2015-000?logo=nextdotjs&logoColor=white) ![React 19](https://img.shields.io/badge/React%2019-149ECA?logo=react&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white) ![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?logo=tailwindcss&logoColor=white) ![Stripe](https://img.shields.io/badge/Stripe-635BFF?logo=stripe&logoColor=white) ![OpenAI](https://img.shields.io/badge/OpenAI-412991?logo=openai&logoColor=white) ![Playwright](https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white)

<img src="https://readme-typing-svg.demolab.com?font=Inter&weight=700&size=22&duration=2600&pause=900&color=FB923C&center=true&vCenter=true&width=900&lines=From+first+phone+call+to+paid+invoice;Quotes%2C+jobs+and+invoices+without+retyping;Built+for+plumbers%2C+HVAC%2C+electricians%2C+roofers+and+contractors" alt="typing"/>

[**Live demo**](https://tradeflow-cyan-nu.vercel.app) · [Product guide](TRADEFLOW_PRODUCT_GUIDE.md) · [Architecture](docs/ARCHITECTURE.md) · [Docs](docs)

</div>

---

## The problem

Trade businesses lose hours to sticky notes, WhatsApp threads and the same details typed three times: into the quote, the job sheet and the invoice. Legacy field-service tools are expensive and slow on a phone. **TradeFlow takes a customer from the first call to a paid invoice in minutes, on any device, without typing anything twice.**

## One pipeline, four stages

```mermaid
flowchart LR
  A[Customer call] --> B[Smart quote<br/>presets or AI]
  B --> C[1-click job dispatch]
  C --> D[Field work<br/>photos, notes, signature]
  D --> E[Invoice + online payment]
  E --> F[(Paid)]
  style A fill:#fb923c,color:#000
  style F fill:#22c55e,color:#000
```

Every screen shows live status (`Draft`, `Sent`, `Scheduled`, `In Progress`, `Completed`, `Paid`) with two-way links between quote, job and invoice.

## Features

| | |
|---|---|
| ⚡ **Smart quotes** | 1-tap trade presets, an AI estimator that turns a plain-English description into line items, a client approval link, and branded PDF export |
| 📱 **Field technician hub** | Daily route, before and after photos, on-screen signature pad, parts and billables added on the fly |
| 💳 **1-click invoicing** | Job data, notes, photos and parts flow into the invoice; Stripe checkout link; partial and offline payments |
| 🔢 **Exact money** | Integer-based calculation engine for tax, discounts and partial payments |
| 🧰 **5 trade presets** | Plumbing, HVAC, electrical and EV, roofing, general contracting; switching updates the whole app |
| 🔐 **Bring your own keys** | Your own OpenAI key, Resend sender domain and Stripe account |

## Stack

<img src="https://skillicons.dev/icons?i=nextjs,react,ts,tailwind,supabase,postgres,docker,vercel,github&perline=9" alt="stack"/>

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind · Supabase (Postgres, Auth) · Stripe · Resend · OpenAI · Vitest · Playwright · Docker

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase, Stripe, Resend, OpenAI keys
npm run dev                  # http://localhost:3000
npm run typecheck && npm test
```

Supabase migrations live in [`supabase/migrations`](supabase/migrations). Deployment notes: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Built by

[Yash Bankar](https://github.com/yashbank), at Crestline Technologies, in personal time, using Claude Code and AI agents under human-owned architecture and review.
